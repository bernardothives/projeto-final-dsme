// embedded-system/main/network.h

#ifndef NETWORK_H
#define NETWORK_H

#include <stdint.h>
#include "esp_err.h"

/**
 * @brief Busca o valor de threshold do backend.
 *
 * @param[out] threshold Ponteiro para armazenar o valor obtido.
 * @return ESP_OK em sucesso, ou código de erro.
 */
esp_err_t network_fetch_threshold(uint32_t *threshold);

/**
 * @brief Envia um log de distância para o backend.
 *
 * @param distance A distância medida em cm.
 * @return ESP_OK em sucesso, ou código de erro.
 */
esp_err_t network_post_log(uint32_t distance);

#endif // NETWORK_H