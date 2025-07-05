#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "hcsr04_driver.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include "network.h"
#include "wifi.h"

// --- Configurações da sua rede Wi-Fi ---
#define WIFI_SSID "s24"
#define WIFI_PASS "tavulha1"

// --- Pino do Atuador (Buzzer) ---
#define BUZZER_PIN GPIO_NUM_22

static const char *TAG = "APP_MAIN";

void app_main(void)
{
    // 1. Configura o pino do buzzer
    gpio_config_t io_conf = {
        .pin_bit_mask = 1ULL << BUZZER_PIN,
        .mode         = GPIO_MODE_OUTPUT,
    };
    ESP_ERROR_CHECK(gpio_config(&io_conf));
    gpio_set_level(BUZZER_PIN, 1); // Garante que o buzzer ativo esteja desligado (nível alto)

    // 2. Conecta ao Wi-Fi
    ESP_ERROR_CHECK(wifi_init_sta(WIFI_SSID, WIFI_PASS));

    // 3. Inicia o driver do sensor ultrassônico
    UltrasonicAssert(UltrasonicInit());

    // 4. Variável para armazenar o limiar de distância
    uint32_t current_threshold = 20; // Valor padrão para o caso de falha na primeira busca

    // 5. Loop principal da aplicação
    while (true) {
        // Busca a configuração mais recente do backend
        // A função já trata os logs de erro, então apenas chamamos
        network_fetch_threshold(&current_threshold);

        // Mede a distância com o sensor
        uint32_t distance;
        esp_err_t err = UltrasonicMeasure(400, &distance);
        UltrasonicAssert(err);

        ESP_LOGI(TAG, "Distância medida: %lu cm | Limiar atual: %lu cm", distance, current_threshold);

        if (err == ESP_OK) {
            // Envia o log da medição para o backend
            network_post_log(distance);

            // Aplica a lógica de acionamento do atuador
            if (distance < current_threshold) {
                ESP_LOGW(TAG, "ALERTA! Objeto detectado dentro do limiar!");
                gpio_set_level(BUZZER_PIN, 0); // Liga o buzzer
                vTaskDelay(pdMS_TO_TICKS(100)); // Deixa o buzzer ligado por 100ms
                gpio_set_level(BUZZER_PIN, 1); // Desliga o buzzer
            }
        } else {
            ESP_LOGE(TAG, "Falha na medição com o sensor HC-SR04: %s", esp_err_to_name(err));
        }

        // Aguarda 5 segundos antes de iniciar o próximo ciclo
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}