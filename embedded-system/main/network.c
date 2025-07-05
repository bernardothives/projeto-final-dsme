#include "network.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "cJSON.h"

static const char *TAG = "NETWORK_CLIENT";

// ###################################################################################
// ##  IMPORTANTE: Substitua pelo IP do computador onde o backend está rodando      ##
// ###################################################################################
#define BACKEND_IP "192.168.1.10" // Exemplo, use o seu IP real (comando 'ipconfig' ou 'ifconfig')

// --- URLs do Backend ---
#define BACKEND_URL_CONFIG "http://" BACKEND_IP ":3000/config"
#define BACKEND_URL_LOGS   "http://" BACKEND_IP ":3000/logs"

esp_err_t _http_event_handler(esp_http_client_event_t *evt) {
    return ESP_OK;
}

esp_err_t network_fetch_threshold(uint32_t *threshold) {
    char response_buffer[128] = {0};
    esp_http_client_config_t config = {
        .url = BACKEND_URL_CONFIG,
        .event_handler = _http_event_handler,
        .timeout_ms = 5000, // Timeout de 5 segundos
    };
    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_err_t err = esp_http_client_perform(client);

    if (err == ESP_OK) {
        int status_code = esp_http_client_get_status_code(client);
        if (status_code == 200) {
            esp_http_client_read_response(client, response_buffer, sizeof(response_buffer)-1);
            cJSON *root = cJSON_Parse(response_buffer);
            if (root) {
                cJSON *item = cJSON_GetObjectItem(root, "threshold_cm");
                if (cJSON_IsNumber(item)) {
                    *threshold = item->valueint;
                    ESP_LOGI(TAG, "Threshold obtido do backend: %lu cm", *threshold);
                } else {
                    err = ESP_FAIL;
                }
                cJSON_Delete(root);
            } else {
                err = ESP_FAIL;
            }
        } else {
             ESP_LOGE(TAG, "Erro no GET de config, status HTTP: %d", status_code);
             err = ESP_FAIL;
        }
    } else {
        ESP_LOGE(TAG, "Falha na requisição GET para /config: %s", esp_err_to_name(err));
    }
    esp_http_client_cleanup(client);
    return err;
}

esp_err_t network_post_log(uint32_t distance) {
    char post_data[64];
    snprintf(post_data, sizeof(post_data), "{\"distancia_cm\": %lu}", distance);

    esp_http_client_config_t config = {
        .url = BACKEND_URL_LOGS,
        .event_handler = _http_event_handler,
        .method = HTTP_METHOD_POST,
        .timeout_ms = 5000,
    };
    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_post_field(client, post_data, strlen(post_data));

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "POST para /logs, status = %d", esp_http_client_get_status_code(client));
    } else {
        ESP_LOGE(TAG, "Falha na requisição POST para /logs: %s", esp_err_to_name(err));
    }
    esp_http_client_cleanup(client);
    return err;
}