#include <ArduinoBLE.h>

#define PIN_ARM_LED             LED_BUILTIN
#define PIN_BATTERY             A0
#define PIN_PYRO_1              2
#define PIN_PYRO_2              3
#define PIN_PYRO_3              4
#define PIN_PYRO_4              5

#define PYRO_INPUT_MODE         INPUT_PULLUP
#define PYRO_CONTINUITY_LEVEL   LOW

#define ADC_BITS                14
#define BATTERY_MIN_MV          6000.0f
#define BATTERY_MAX_MV          8400.0f
#define BATTERY_SAMPLES         16

#define STATUS_INTERVAL_MS      50

#define BLE_LOCAL_NAME          "Seadream Avionics"
#define BLE_SERVICE_UUID        "a1b20000-5c3d-4e6f-8a9b-0c1d2e3f4a5b"
#define BLE_ARM_UUID            "a1b20001-5c3d-4e6f-8a9b-0c1d2e3f4a5b"
#define BLE_STATUS_UUID         "a1b20002-5c3d-4e6f-8a9b-0c1d2e3f4a5b"

#define STATUS_PACKET_BYTES     4

#define CMD_DISARM              0x00
#define CMD_ARM                 0x01
#define CMD_STATUS              0x02

static const uint8_t PYRO_PINS[4] = {
  PIN_PYRO_1,
  PIN_PYRO_2,
  PIN_PYRO_3,
  PIN_PYRO_4,
};

BLEService armingService(BLE_SERVICE_UUID);
BLEByteCharacteristic armCharacteristic(BLE_ARM_UUID, BLEWrite);
BLECharacteristic statusCharacteristic(BLE_STATUS_UUID, BLERead | BLENotify, STATUS_PACKET_BYTES);

static bool armed = false;
static uint32_t lastStatusMs = 0;

static void setArmed(bool next) {
  armed = next;
  digitalWrite(PIN_ARM_LED, armed ? HIGH : LOW);
}

static uint8_t continuityMask() {
  uint8_t mask = 0;
  for (uint8_t i = 0; i < 4; i++) {
    if (digitalRead(PYRO_PINS[i]) == PYRO_CONTINUITY_LEVEL) {
      mask |= (1 << i);
    }
  }
  return mask;
}

static uint16_t batteryMillivolts() {
  uint32_t total = 0;
  for (uint8_t i = 0; i < BATTERY_SAMPLES; i++) {
    total += analogRead(PIN_BATTERY);
  }

  const float counts = (float)total / (float)BATTERY_SAMPLES;
  const float full = (float)((1UL << ADC_BITS) - 1UL);

  float fraction = counts / full;
  if (fraction < 0.0f) fraction = 0.0f;
  if (fraction > 1.0f) fraction = 1.0f;

  const float mv = BATTERY_MIN_MV + fraction * (BATTERY_MAX_MV - BATTERY_MIN_MV);
  return (uint16_t)(mv + 0.5f);
}

static void sendStatus() {
  const uint16_t mv = batteryMillivolts();
  uint8_t packet[STATUS_PACKET_BYTES];

  packet[0] = continuityMask();
  packet[1] = armed ? 1 : 0;
  packet[2] = (uint8_t)(mv >> 8);
  packet[3] = (uint8_t)(mv & 0xFF);

  statusCharacteristic.writeValue(packet, STATUS_PACKET_BYTES);
  lastStatusMs = millis();
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_ARM_LED, OUTPUT);
  for (uint8_t i = 0; i < 4; i++) {
    pinMode(PYRO_PINS[i], PYRO_INPUT_MODE);
  }

  analogReadResolution(ADC_BITS);
  setArmed(false);

  if (!BLE.begin()) {
    while (true) {
      digitalWrite(PIN_ARM_LED, (millis() / 100) % 2);
    }
  }

  BLE.setLocalName(BLE_LOCAL_NAME);
  BLE.setDeviceName(BLE_LOCAL_NAME);
  BLE.setAdvertisedService(armingService);

  armingService.addCharacteristic(armCharacteristic);
  armingService.addCharacteristic(statusCharacteristic);
  BLE.addService(armingService);

  armCharacteristic.writeValue(0);
  sendStatus();

  BLE.advertise();
}

void loop() {
  BLEDevice central = BLE.central();

  if (!central) {
    if (millis() - lastStatusMs >= STATUS_INTERVAL_MS) {
      sendStatus();
    }
    return;
  }

  while (central.connected()) {
    if (armCharacteristic.written()) {
      switch (armCharacteristic.value()) {
        case CMD_DISARM:
          setArmed(false);
          sendStatus();
          break;
        case CMD_ARM:
          setArmed(true);
          sendStatus();
          break;
        case CMD_STATUS:
          sendStatus();
          break;
        default:
          setArmed(false);
          sendStatus();
          break;
      }
    }

    if (millis() - lastStatusMs >= STATUS_INTERVAL_MS) {
      sendStatus();
    }
  }

  setArmed(false);
  sendStatus();

  BLE.stopAdvertise();
  BLE.advertise();
}
