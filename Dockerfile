FROM keybaseio/client:stable-node-slim
COPY . .
RUN yarn
RUN chmod +x /provision.sh
CMD ["/provision.sh"]
