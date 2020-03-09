FROM keybaseio/client:stable-node-slim
COPY . .
RUN chmod +x /provision.sh
CMD ["/provision.sh"]
