#include <Wire.h>

const byte ADDR = 0x1D;
const byte REG_OUT_X_MSB = 0x01;
const byte REG_CTRL1     = 0x2A;


const int LED_PIN = 9;          // was 8; pin 9 supports PWM
const int BRIGHTNESS = 40;      // 0 = off, 255 = full brightness
const int THRESHOLD = 200;          // counts; ~0.1 g change between samples
const unsigned long HOLD_MS = 1000; // LED stays on this long after last motion
const int MIN_SAMPLES = 3;   // consecutive samples above threshold needed
int overCount = 0;

int px, py, pz;                     // previous reading
unsigned long lastMotion = 0;
bool lit = false;

void writeReg(byte reg, byte val) {
  Wire.beginTransmission(ADDR);
  Wire.write(reg);
  Wire.write(val);
  Wire.endTransmission();
}

void readXYZ(int &x, int &y, int &z) {
  Wire.beginTransmission(ADDR);
  Wire.write(REG_OUT_X_MSB);
  Wire.endTransmission(false);
  Wire.requestFrom(ADDR, (byte)6);
  int v[3];
  for (int i = 0; i < 3; i++) {
    byte msb = Wire.read();
    byte lsb = Wire.read();
    int16_t raw = (int16_t)(((uint16_t)msb << 8) | lsb);
    v[i] = raw >> 4;
  }
  x = v[0];
  y = v[1];
  z = v[2];
}

void setup() {
  Serial.begin(9600);
  Wire.begin();
  pinMode(LED_PIN, OUTPUT);
  writeReg(REG_CTRL1, 0x01);        // active mode
  delay(100);                       // let first measurement settle
  readXYZ(px, py, pz);
}

void loop() {
  int x, y, z;
  readXYZ(x, y, z);

  int delta = abs(x - px) + abs(y - py) + abs(z - pz);
  px = x; py = y; pz = z;

  if (delta > THRESHOLD) {
    overCount++;
  } else {
    overCount = 0;
  }
  if (overCount >= MIN_SAMPLES) {
    lastMotion = millis();
    lit = true;
  }
  if (lit && millis() - lastMotion > HOLD_MS) {
    lit = false;
  }
  analogWrite(LED_PIN, lit ? BRIGHTNESS : 0);

  Serial.println(delta);            // for tuning the threshold
  delay(20);                        // ~50 samples per second
}