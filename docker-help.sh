# docker-help.sh

# Очищаем старые контейнеры
sudo docker stop my-app-container 2>/dev/null
sudo docker rm my-app-container 2>/dev/null
sudo docker rmi my-app 2>/dev/null

# Собираем образ
sudo docker build -t my-app .

# Запускаем контейнер
sudo docker run -d --name my-app-container -p 5000:3001 my-app

# Проверяем логи
sudo docker logs my-app-container


# Убедитесь, что сервер слушает правильный порт
cat server/.env | grep -i port

# Nginx перед Docker (рекомендуемый для продакшена)
# Самая распространенная и надежная схема: nginx работает на хосте как reverse proxy, проксируя запросы к вашему Docker-контейнеру.

# Шаг 1: Запускаем Docker-контейнер с внутренним портом
# Запускаем контейнер без прямого доступа извне (или только localhost)
sudo docker run -d \
  --name my-app-container \
  --restart always \
  -p 127.0.0.1:5000:3001 \
  my-app

# Получение сертификата
sudo certbot --nginx -d ai-docs-helper-css.thm.su
