//Back-end API RESTful
import fastify from "fastify"
import cors from "@fastify/cors"
import { appRoutes } from "./routes"

const app = fastify()

//Com isso, o front-end ja vai conseguir acessar os dados do back-end
app.register(cors)
app.register(appRoutes)
app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log("HTTP Server running!")
  })
