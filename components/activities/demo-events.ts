import { startOfWeek, type Event } from "./lib"

// Datos de ejemplo ubicados en la semana actual para que siempre sean visibles
export function createDemoEvents(today: Date): Event[] {
  const monday = startOfWeek(today)
  const at = (dayOffset: number, hour: number, minute = 0) => {
    const date = new Date(monday)
    date.setDate(date.getDate() + dayOffset)
    date.setHours(hour, minute, 0, 0)
    return date
  }

  return [
    {
      id: "1",
      title: "Daily del equipo",
      description: "Sincronización diaria con el equipo de ingeniería para revisar avances y bloqueos",
      startTime: at(0, 9),
      endTime: at(0, 9, 30),
      color: "blue",
      category: "Reunión",
      attendees: ["Ana", "Bruno", "Carla"],
      tags: ["Trabajo", "Equipo"],
    },
    {
      id: "2",
      title: "Revisión de diseño",
      description: "Revisar las nuevas maquetas del dashboard con las partes interesadas",
      startTime: at(0, 14),
      endTime: at(0, 15, 30),
      color: "purple",
      category: "Reunión",
      attendees: ["Sara", "Miguel"],
      tags: ["Importante", "Cliente"],
    },
    {
      id: "3",
      title: "Code review",
      description: "Revisar los pull requests de la funcionalidad de autenticación",
      startTime: at(1, 10),
      endTime: at(1, 11),
      color: "green",
      category: "Tarea",
      tags: ["Trabajo", "Urgente"],
    },
    {
      id: "4",
      title: "Presentación al cliente",
      description: "Presentar la hoja de ruta del trimestre y las novedades",
      startTime: at(2, 15),
      endTime: at(2, 16, 30),
      color: "orange",
      category: "Reunión",
      attendees: ["Juan", "Emma", "David"],
      tags: ["Importante", "Cliente"],
    },
    {
      id: "5",
      title: "Gimnasio",
      startTime: at(0, 18),
      endTime: at(0, 19),
      color: "pink",
      category: "Personal",
      tags: ["Personal"],
    },
    {
      id: "6",
      title: "Planificación del sprint",
      description: "Planificar tareas y estimar puntos de historia del próximo sprint",
      startTime: at(3, 10),
      endTime: at(3, 12),
      color: "blue",
      category: "Reunión",
      attendees: ["Equipo"],
      tags: ["Trabajo", "Equipo", "Importante"],
    },
    {
      id: "7",
      title: "Cita médica",
      description: "Chequeo anual",
      startTime: at(4, 11),
      endTime: at(4, 12),
      color: "red",
      category: "Personal",
      tags: ["Personal", "Importante"],
    },
    {
      id: "8",
      title: "Despliegue a producción",
      description: "Publicar la versión 2.5.0 con nuevas funcionalidades y correcciones",
      startTime: at(4, 16),
      endTime: at(4, 17),
      color: "green",
      category: "Tarea",
      tags: ["Trabajo", "Urgente"],
    },
    {
      id: "9",
      title: "Café con Sara",
      startTime: at(5, 15),
      endTime: at(5, 16),
      color: "pink",
      category: "Personal",
      tags: ["Personal"],
    },
    {
      id: "10",
      title: "Revisión de presupuesto",
      description: "Revisión trimestral del presupuesto con finanzas",
      startTime: at(7, 13),
      endTime: at(7, 14, 30),
      color: "orange",
      category: "Reunión",
      attendees: ["Finanzas"],
      tags: ["Trabajo", "Importante"],
    },
  ]
}
