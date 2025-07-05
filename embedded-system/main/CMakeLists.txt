idf_component_register(
    SRCS       "main.c" "network.c" "wifi.c"
    INCLUDE_DIRS "."
    REQUIRES
      driver
      freertos
      esp_http_server
      esp_https_server
      esp_netif
      esp_wifi
      nvs_flash
      hcsr04
      # --- DEPENDÊNCIAS ADICIONADAS PARA COMUNICAÇÃO COM O BACKEND ---
      esp_http_client
      cjson
)