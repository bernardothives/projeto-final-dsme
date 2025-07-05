// embedded-system/main/wifi.h

#ifndef WIFI_H
#define WIFI_H

#include "esp_err.h"

/**
 * @brief Inicializa o driver Wi-Fi em modo Station e conecta à rede.
 *
 * @param ssid     Nome da rede Wi-Fi (SSID).
 * @param password Senha da rede Wi-Fi.
 * @return ESP_OK  Se conectado com sucesso.
 * Outro   Código de erro em falha.
 */
esp_err_t wifi_init_sta(const char *ssid, const char *password);

#endif // WIFI_H