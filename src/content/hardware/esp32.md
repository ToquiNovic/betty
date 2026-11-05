---
title: Guía de Conexión ESP32 (C++/Arduino)
description: Código completo y configuración para conectar placas ESP32 a Betty.
---

El ESP32 es el microcontrolador recomendado para Betty debido a su conectividad WiFi dual, aceleración criptográfica y bajo consumo.

---

## 📦 Librerías Necesarias (Arduino IDE / PlatformIO)

Instala las siguientes librerías desde el Gestor de Librerías:
- `PubSubClient` (por Nick O'Leary)
- `ArduinoJson` (v6 o v7 por Benoît Blanchon)

---

## 💻 Código Fuente de Ejemplo

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// 1. Configuración de Red WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// 2. Configuración de Betty MQTT Broker
const char* mqtt_server = "192.168.1.100"; // IP o dominio de tu servidor Betty
const int mqtt_port = 1883;

// 3. Credenciales del Sensor en Betty
const char* sensor_id = "4c40ea57-43e0-4ee2-a8d5-77aae4fc387b"; // UUID
const char* api_key = "betty_live_a1b2c3d4e5f6g7h8...";          // API Key completa

const char* mqtt_topic = "betty/sensor/4c40ea57-43e0-4ee2-a8d5-77aae4fc387b/data";
const char* mqtt_command_topic = "betty/sensor/4c40ea57-43e0-4ee2-a8d5-77aae4fc387b/command";

WiFiClient espClient;
PubSubClient client(espClient);

// Control de Activador y Telemetría Bajo Demanda
unsigned long lastMsg = 0;
unsigned long samplingIntervalMs = 60000; // Por defecto: 60s en reposo (standby)
unsigned long activeLeaseExpiry = 0;
bool isActiveMode = false;

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  deserializeJson(doc, payload, length);

  const char* cmd = doc["command"];
  if (cmd && strcmp(cmd, "set_sampling_rate") == 0) {
    const char* mode = doc["payload"]["mode"] | "standby";
    unsigned long interval = doc["payload"]["interval_ms"] | 60000;
    unsigned long ttl = doc["payload"]["ttl_seconds"] | 60;

    samplingIntervalMs = interval;
    if (strcmp(mode, "active") == 0) {
      isActiveMode = true;
      activeLeaseExpiry = millis() + (ttl * 1000UL);
      Serial.printf("[ACTIVADOR] Modo ACTIVO: %lu ms (Lease: %lu s)\n", interval, ttl);
    } else {
      isActiveMode = false;
      activeLeaseExpiry = 0;
      Serial.printf("[ACTIVADOR] Modo STANDBY: %lu ms\n", interval);
    }
  }
}

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Conectando a ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi conectado. IP: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Conectando a Betty MQTT Broker...");
    if (client.connect(sensor_id, sensor_id, api_key)) {
      Serial.println(" ¡Conectado exitosamente!");
      client.subscribe(mqtt_command_topic); // Suscripción a comandos del Activador
    } else {
      Serial.print(" Falló conexión, rc=");
      Serial.print(client.state());
      Serial.println(" Reintentando en 5 segundos...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(onMqttMessage);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();

  // Watchdog local: si el avatar salió o el metaverso se cerró sin avisar
  if (isActiveMode && activeLeaseExpiry > 0 && now > activeLeaseExpiry) {
    isActiveMode = false;
    samplingIntervalMs = 60000;
    activeLeaseExpiry = 0;
    Serial.println("[WATCHDOG] Lease expirado. Volviendo a STANDBY automáticamente.");
  }

  // Transmisión con cadencia dinámica
  if (now - lastMsg > samplingIntervalMs) {
    lastMsg = now;

    // Simular lecturas de sensores (o leer sensores reales)
    float temp = 22.0 + (random(0, 100) / 10.0);
    float hum = 50.0 + (random(0, 200) / 10.0);

    StaticJsonDocument<256> doc;
    doc["origin_type"] = "sensor";
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["is_active_stream"] = isActiveMode;

    char buffer[256];
    serializeJson(doc, buffer);

    Serial.print("Publicando datos: ");
    Serial.println(buffer);
    client.publish(mqtt_topic, buffer);
  }
}
```
