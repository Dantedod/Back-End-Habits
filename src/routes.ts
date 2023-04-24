import { prisma } from "./libs/prisma"
import { z } from "zod"
import { FastifyInstance } from "fastify"
import dayjs from "dayjs"
//no typescript, todo parementro da função, precisa ter um tipo, precsa dizer para ele qual o formato da informação, entao basta importar esse fastify instance e colocar ali como sendo o tipo do app na função
export async function appRoutes(app: FastifyInstance) {
  //metodo HTPP: Get(Sempre que eu for buscar alguma informação), Post(quando eu tenho uma rota que vai criar alguma coisa), Put(Quadno é uma rota que vai atualizar algum recurso por completo), Patch(Quando eu for atualizar uma informação especifica de um recurso), Delete(Quando eu vou deletar um recurso dentro do meu Back End)

  //se eu quero aguarda essa chaamda do banco de dados ser finalizada antes de retornar os dados do back end, tenho q usar o await e apra usar o await tem q ser uma função async por isso coloquei o async function e await ali
  app.post('/habits', async (request) => {
    //tittle, weekDays
    //essa parte aki é a validação, para o tittle e weekdDays funcionarem.
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(z.number().min(0).max(6)),
    })

    const { title, weekDays } = createHabitBody.parse(request.body)

    const today = dayjs().startOf("day").toDate()
    //esse startof, fazer os segundos, minutos e milesimos ficarem 00.
    //criando novo habito
    await prisma.habit.create({
      data: {
        title,
        created_at: today,

        weekDays: {
          //esta percorrendo os dias da semana q eu recebi na variavel weekdays, que seriam de 0-6m onde 0 eh domingo e 5 é sabado e para cada dia da semana, ele vai retornar um objeto com as informações q eu quero inserir
          create: weekDays.map((weekDays) => {
            return {
              //aki ta falando q o dia da semana da tabela vai ser igual o dia da semana que estou recebendo como parametro
              week_day: weekDays,
            }
          }),
        },
      },
    })
  })

  app.get('/day', async (request) => {
    //basicamente essa data é qual dia eu quero buscar as informações
    const getDayParams = z.object({
      date: z.coerce.date(),
      //coerce vai converter o parametro q vou receber ai dentro desse date em uma data, basicamente ele via fazer new Date(parametro) e vai retornar o valor ja manipulado
    })
    //vou receber isso como um queryparam : localhost:3333/day?date=2023-01-12 exemplo
    const { date } = getDayParams.parse(request.query)

    const parseDate = dayjs(date).startOf("day")
    const weekDay = parseDate.get("day")
    //tdos habitos possivels naquele dia
    //habitos que ja foram completados

    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          //"LTE" é uma abreviação de "Less Than or Equal To", em português "Menor ou igual a"
          lte: date,
        },
        weekDays: {
          some: {
            week_day: weekDay,
          },
        },
      },
    })

    //to buscando o dia dentro da tabela do banco de dados, onde a data de la seja igual a data q estou enviando aki
    const day = await prisma.day.findUnique({
      where: {
        date: parseDate.toDate(),
      },
      include: {
        dayHabits: true,
      },
    })
    //esse ? é para verificar se o dia nao esta nulo, pq se tiver nulo(sem nenhuma informação) vai da erro
    const completedHabits = day?.dayHabits.map((dayHabit) => {
      //map para pecorrer todos os habitos completados naquele dia, e para cada registro na dayhabbit, eu vou retornar dayhabbit.habitid, ou seja, vou ter apenas os IDS dos habitos completados.
      return dayHabit.habit_id
    }) ?? []//esse ?? [] é para colocar um array vazio caso o valor esteja indefinido

    return {
      possibleHabits,
      completedHabits,
    }
  })

  //completar / nao completar um habito
  app.patch('/habits/:id/toggle', async (request) => {
    //route param =: parametro de identificação(indenfificar o id do habito que estamos querendo fazer o toogle)

    const toggleHabitParams = z.object(
      {
        id: z.string().uuid(),
      })

    const { id } = toggleHabitParams.parse(request.params)

    //startofday é uma forma de descarta os minutos e segundos
    const today = dayjs().startOf('day').toDate()


    //vou procurar no prisma um dia onde a data seja igual a data de hj(today)
    let day = await prisma.day.findUnique({
      where: {
        date: today,
      }
    })


    //se eu n encontrar o dia ou seja, o dia n esteja cadastrado no banco de dados, significa que a pessoa n tinha completado nenhum habito ainda, vou  criar a informação no banco de dados, passando data, date unico campo obrigatorio como sendo today e assim criamos a informação la dentro
    if (!day) {
      day = await prisma.day.create({
        data: {
          date: today,
        }
      })
    }


    //buscando um registro no bando de dadso na tabela dayhabits, para ve se o usuario ja tinha marcado esse habito como completo nesse dia, 
    const dayHabit = await prisma.dayHabit.findUnique({
      where: {
        day_id_habit_id: {
          day_id: day.id,
          habit_id: id,
        }
      }
    })

    //se ele encontou o day habit, que dizer q ele ja tinah marcado o habito como completo antes entao ele vai pro if abaixo e remove/deleta, para a proxima vez que executar essa rota ele vai cair na segunda condição do if
    if (dayHabit) {
      //remover a marcação de completo
      await prisma.dayHabit.delete({
        where: {
          id: dayHabit.id,
        }

      })
    } else {
      //completar o habito nesse dia
      await prisma.dayHabit.create({
        data: {
          day_id: day.id,
          habit_id: id,
        }
      })
    }
  })

  app.get('/summary', async () => {

    const summary = await prisma.$queryRaw`
      SELECT
       D.id,
       D.date,
       --subcary
      (
        SELECT 
          cast(count(*) as float)
        FROM days_habits DH 
        WHERE DH.day_id = D.id
      ) as completed  ,
      --subcary
      (
        SELECT
        cast(count(*) as float)
        From habbit_week_days HWD   
        JOIN habits H
           ON H.id = HWD.habit_id
        WHERE 
        HWD.week_day = cast(strftime('%w', D.date/1000.0, 'unixepoch') as int) 
        AND H.created_at <= D.date
      ) as amount
      From days D
    `
    return summary
  })
}
