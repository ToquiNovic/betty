---
title: Integración con Motores 3D (Unity / Unreal Engine)
description: Cómo conectar entornos de simulación en Unity y Unreal a la ingesta de Betty.
---

Los motores de juego como Unity y Unreal Engine permiten construir experiencias inmersivas de gemelos digitales y metaversos que pueden transmitir o recibir datos de Betty.

---

## 🎮 Integración con Unity (C#)

Puedes utilizar la librería **M2Mqtt** o paquetes WebSocket para comunicarte con Betty.

### Ejemplo de Publicación en Unity (C#):

```csharp
using UnityEngine;
using uPLibrary.Networking.M2Mqtt;
using uPLibrary.Networking.M2Mqtt.Messages;
using System.Text;

public class BettyTwinSender : MonoBehaviour
{
    private MqttClient client;
    public string brokerIp = "127.0.0.1";
    public string sensorId = "tu-sensor-uuid";
    public string apiKey = "betty_live_...";

    void Start()
    {
        client = new MqttClient(brokerIp);
        byte code = client.Connect(sensorId, sensorId, apiKey);
        Debug.Log("Conectado a Betty MQTT con código: " + code);
    }

    void Update()
    {
        // Enviar posición X, Y, Z del objeto cada segundo
        if (Time.frameCount % 60 == 0 && client != null && client.IsConnected)
        {
            Vector3 pos = transform.position;
            string payload = $"{{\"pos_x\": {pos.x}, \"pos_y\": {pos.y}, \"pos_z\": {pos.z}, \"origin_type\": \"metaverso\"}}";
            
            client.Publish("betty/sensor/" + sensorId + "/data", Encoding.UTF8.GetBytes(payload));
        }
    }
}
```

---

## 🕹️ Integración con Unreal Engine (Blueprints / C++)

- Utiliza el plugin **MQTT for Unreal** del Marketplace.
- Configura el cliente con el ID del sensor y el hash de la API Key en el puerto `1883`.
- Publica en `betty/sensor/:id/data` con `origin_type: "metaverso"`.
