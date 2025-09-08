import { body, validationResult } from "express-validator";

// Validar resultados
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validaciones para talleres
export const validateTaller = {
  create: [
    body("nombre")
      .trim()
      .notEmpty()
      .withMessage("El nombre del taller es requerido")
      .isLength({ min: 2, max: 100 })
      .withMessage("El nombre debe tener entre 2 y 100 caracteres"),

    body("direccion")
      .trim()
      .notEmpty()
      .withMessage("La dirección es requerida")
      .isLength({ min: 10, max: 255 })
      .withMessage("La dirección debe tener entre 10 y 255 caracteres"),

    body("telefono")
      .trim()
      .notEmpty()
      .withMessage("El teléfono es requerido")
      .isLength({ min: 7, max: 20 })
      .withMessage("El teléfono debe tener entre 7 y 20 caracteres"),

    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Correo electrónico inválido")
      .normalizeEmail({ gmail_remove_dots: false }),

    body("latitud")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("La latitud debe ser un número entre -90 y 90"),

    body("longitud")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("La longitud debe ser un número entre -180 y 180"),

    body("horario_apertura")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("El horario de apertura debe estar en formato HH:MM"),

    body("horario_cierre")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("El horario de cierre debe estar en formato HH:MM"),

    body("dias_trabajo")
      .optional()
      .isArray()
      .withMessage("Los días de trabajo deben ser un array"),

    body("servicios_ofrecidos")
      .optional()
      .isArray()
      .withMessage("Los servicios ofrecidos deben ser un array"),

    validate
  ],

  update: [
    body("nombre")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("El nombre debe tener entre 2 y 100 caracteres"),

    body("direccion")
      .optional()
      .trim()
      .isLength({ min: 10, max: 255 })
      .withMessage("La dirección debe tener entre 10 y 255 caracteres"),

    body("telefono")
      .optional()
      .trim()
      .isLength({ min: 7, max: 20 })
      .withMessage("El teléfono debe tener entre 7 y 20 caracteres"),

    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Correo electrónico inválido"),

    body("latitud")
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage("La latitud debe ser un número entre -90 y 90"),

    body("longitud")
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage("La longitud debe ser un número entre -180 y 180"),

    body("estado")
      .optional()
      .isIn(['activo', 'inactivo', 'suspendido'])
      .withMessage("El estado debe ser: activo, inactivo o suspendido"),

    validate
  ]
};

// Validaciones para evaluaciones
export const validateEvaluacion = {
  create: [
    body("taller_id")
      .notEmpty()
      .withMessage("El ID del taller es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID del taller debe ser un número entero positivo"),

    body("carro_id")
      .notEmpty()
      .withMessage("El ID del carro es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID del carro debe ser un número entero positivo"),

    body("tipo_evaluacion")
      .notEmpty()
      .withMessage("El tipo de evaluación es requerido")
      .isIn(['preventiva', 'diagnostica', 'post_reparacion'])
      .withMessage("El tipo de evaluación debe ser: preventiva, diagnostica o post_reparacion"),

    body("fecha_evaluacion")
      .notEmpty()
      .withMessage("La fecha de evaluación es requerida")
      .isISO8601()
      .withMessage("La fecha debe estar en formato ISO 8601"),

    body("hora_evaluacion")
      .notEmpty()
      .withMessage("La hora de evaluación es requerida")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora debe estar en formato HH:MM"),

    body("kilometraje_actual")
      .optional()
      .isInt({ min: 0 })
      .withMessage("El kilometraje debe ser un número entero positivo"),

    body("nivel_aceite")
      .optional()
      .isIn(['bajo', 'normal', 'alto'])
      .withMessage("El nivel de aceite debe ser: bajo, normal o alto"),

    body("nivel_refrigerante")
      .optional()
      .isIn(['bajo', 'normal', 'alto'])
      .withMessage("El nivel de refrigerante debe ser: bajo, normal o alto"),

    body("estado_frenos")
      .optional()
      .isIn(['excelente', 'bueno', 'regular', 'malo'])
      .withMessage("El estado de frenos debe ser: excelente, bueno, regular o malo"),

    body("estado_neumaticos")
      .optional()
      .isIn(['excelente', 'bueno', 'regular', 'malo'])
      .withMessage("El estado de neumáticos debe ser: excelente, bueno, regular o malo"),

    body("estado_bateria")
      .optional()
      .isIn(['excelente', 'bueno', 'regular', 'malo'])
      .withMessage("El estado de batería debe ser: excelente, bueno, regular o malo"),

    body("estado_motor")
      .optional()
      .isIn(['excelente', 'bueno', 'regular', 'malo'])
      .withMessage("El estado del motor debe ser: excelente, bueno, regular o malo"),

    body("costo_estimado")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El costo estimado debe ser un número positivo"),

    validate
  ],

  update: [
    body("tipo_evaluacion")
      .optional()
      .isIn(['preventiva', 'diagnostica', 'post_reparacion'])
      .withMessage("El tipo de evaluación debe ser: preventiva, diagnostica o post_reparacion"),

    body("fecha_evaluacion")
      .optional()
      .isISO8601()
      .withMessage("La fecha debe estar en formato ISO 8601"),

    body("hora_evaluacion")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora debe estar en formato HH:MM"),

    body("estado")
      .optional()
      .isIn(['pendiente', 'en_proceso', 'completada', 'cancelada'])
      .withMessage("El estado debe ser: pendiente, en_proceso, completada o cancelada"),

    body("kilometraje_actual")
      .optional()
      .isInt({ min: 0 })
      .withMessage("El kilometraje debe ser un número entero positivo"),

    body("costo_estimado")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El costo estimado debe ser un número positivo"),

    body("calificacion_servicio")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("La calificación debe ser un número entre 1 y 5"),

    validate
  ],

  complete: [
    body("calificacion_servicio")
      .notEmpty()
      .withMessage("La calificación del servicio es requerida")
      .isInt({ min: 1, max: 5 })
      .withMessage("La calificación debe ser un número entre 1 y 5"),

    body("comentario_cliente")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("El comentario no puede exceder 500 caracteres"),

    validate
  ],

  createEntrada: [
    body("carroId")
      .notEmpty()
      .withMessage("El ID del carro es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID del carro debe ser un número entero positivo"),

    body("tallerId")
      .notEmpty()
      .withMessage("El ID del taller es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID del taller debe ser un número entero positivo"),

    body("kilometrajeEntrada")
      .notEmpty()
      .withMessage("El kilometraje de entrada es requerido")
      .isInt({ min: 0 })
      .withMessage("El kilometraje debe ser un número entero positivo"),

    body("estadoExterior")
      .optional()
      .isObject()
      .withMessage("El estado exterior debe ser un objeto"),

    body("estadoInterior")
      .optional()
      .isObject()
      .withMessage("El estado interior debe ser un objeto"),

    body("observacionesGenerales")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Las observaciones no pueden exceder 1000 caracteres"),

    body("tecnicoResponsable")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("El nombre del técnico no puede exceder 100 caracteres"),

    validate
  ],

  updatePruebas: [
    body("evaluacionId")
      .notEmpty()
      .withMessage("El ID de la evaluación es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID de la evaluación debe ser un número entero positivo"),

    body("motor")
      .optional()
      .isObject()
      .withMessage("Los datos del motor deben ser un objeto"),

    body("frenos")
      .optional()
      .isObject()
      .withMessage("Los datos de frenos deben ser un objeto"),

    body("suspension")
      .optional()
      .isObject()
      .withMessage("Los datos de suspensión deben ser un objeto"),

    body("direccion")
      .optional()
      .isObject()
      .withMessage("Los datos de dirección deben ser un objeto"),

    body("luces")
      .optional()
      .isObject()
      .withMessage("Los datos de luces deben ser un objeto"),

    body("neumaticos")
      .optional()
      .isObject()
      .withMessage("Los datos de neumáticos deben ser un objeto"),

    body("sistemaElectrico")
      .optional()
      .isObject()
      .withMessage("Los datos del sistema eléctrico deben ser un objeto"),

    body("transmision")
      .optional()
      .isObject()
      .withMessage("Los datos de transmisión deben ser un objeto"),

    body("aireAcondicionado")
      .optional()
      .isObject()
      .withMessage("Los datos del aire acondicionado deben ser un objeto"),

    body("liquidos")
      .optional()
      .isObject()
      .withMessage("Los datos de líquidos deben ser un objeto"),

    body("observacionesTecnicas")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Las observaciones técnicas no pueden exceder 1000 caracteres"),

    validate
  ],

  createFinal: [
    body("evaluacionId")
      .notEmpty()
      .withMessage("El ID de la evaluación es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID de la evaluación debe ser un número entero positivo"),

    body("resumenHallazgos")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("El resumen de hallazgos no puede exceder 1000 caracteres"),

    body("prioridadReparaciones")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("La prioridad de reparaciones no puede exceder 500 caracteres"),

    body("tiempoEstimadoReparacion")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El tiempo estimado debe ser un número positivo"),

    body("observacionesFinales")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Las observaciones finales no pueden exceder 1000 caracteres"),

    body("tecnicoEvaluador")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("El nombre del técnico evaluador no puede exceder 100 caracteres"),

    body("reparacionesRecomendadas")
      .optional()
      .isArray()
      .withMessage("Las reparaciones recomendadas deben ser un array"),

    validate
  ]
};

// Validaciones para horarios
export const validateHorario = {
  create: [
    body("taller_id")
      .notEmpty()
      .withMessage("El ID del taller es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID del taller debe ser un número entero positivo"),

    body("dia_semana")
      .notEmpty()
      .withMessage("El día de la semana es requerido")
      .isIn(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'])
      .withMessage("El día debe ser: lunes, martes, miercoles, jueves, viernes, sabado o domingo"),

    body("hora_apertura")
      .notEmpty()
      .withMessage("La hora de apertura es requerida")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de apertura debe estar en formato HH:MM"),

    body("hora_cierre")
      .notEmpty()
      .withMessage("La hora de cierre es requerida")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de cierre debe estar en formato HH:MM"),

    body("fecha_desde")
      .notEmpty()
      .withMessage("La fecha desde es requerida")
      .isISO8601()
      .withMessage("La fecha debe estar en formato ISO 8601"),

    body("fecha_hasta")
      .optional()
      .isISO8601()
      .withMessage("La fecha debe estar en formato ISO 8601"),

    body("duracion_cita_minutos")
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage("La duración de la cita debe ser entre 15 y 480 minutos"),

    body("citas_maximas_por_dia")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Las citas máximas por día deben ser entre 1 y 50"),

    validate
  ],

  update: [
    body("dia_semana")
      .optional()
      .isIn(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'])
      .withMessage("El día debe ser: lunes, martes, miercoles, jueves, viernes, sabado o domingo"),

    body("hora_apertura")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de apertura debe estar en formato HH:MM"),

    body("hora_cierre")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de cierre debe estar en formato HH:MM"),

    body("esta_abierto")
      .optional()
      .isBoolean()
      .withMessage("El campo esta_abierto debe ser verdadero o falso"),

    body("duracion_cita_minutos")
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage("La duración de la cita debe ser entre 15 y 480 minutos"),

    body("citas_maximas_por_dia")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Las citas máximas por día deben ser entre 1 y 50"),

    validate
  ],

  createWeekly: [
    body("taller_id")
      .notEmpty()
      .withMessage("El ID del taller es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID del taller debe ser un número entero positivo"),

    body("hora_apertura")
      .notEmpty()
      .withMessage("La hora de apertura es requerida")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de apertura debe estar en formato HH:MM"),

    body("hora_cierre")
      .notEmpty()
      .withMessage("La hora de cierre es requerida")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de cierre debe estar en formato HH:MM"),

    body("fecha_desde")
      .notEmpty()
      .withMessage("La fecha desde es requerida")
      .isISO8601()
      .withMessage("La fecha debe estar en formato ISO 8601"),

    body("fecha_hasta")
      .optional()
      .isISO8601()
      .withMessage("La fecha debe estar en formato ISO 8601"),

    body("duracion_cita_minutos")
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage("La duración de la cita debe ser entre 15 y 480 minutos"),

    body("citas_maximas_por_dia")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Las citas máximas por día deben ser entre 1 y 50"),

    validate
  ],

  updateWeekly: [
    body("hora_apertura")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de apertura debe estar en formato HH:MM"),

    body("hora_cierre")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de cierre debe estar en formato HH:MM"),

    body("fecha_desde")
      .optional()
      .isISO8601()
      .withMessage("La fecha debe estar en formato ISO 8601"),

    body("fecha_hasta")
      .optional()
      .isISO8601()
      .withMessage("La fecha debe estar en formato ISO 8601"),

    body("duracion_cita_minutos")
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage("La duración de la cita debe ser entre 15 y 480 minutos"),

    body("citas_maximas_por_dia")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Las citas máximas por día deben ser entre 1 y 50"),

    validate
  ],

  createDay: [
    body("fecha")
      .notEmpty()
      .withMessage("La fecha es requerida")
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("La fecha debe estar en formato YYYY-MM-DD"),

    body("hora_apertura")
      .notEmpty()
      .withMessage("La hora de apertura es requerida")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de apertura debe estar en formato HH:MM"),

    body("hora_cierre")
      .notEmpty()
      .withMessage("La hora de cierre es requerida")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de cierre debe estar en formato HH:MM"),

    body("esta_abierto")
      .optional()
      .isBoolean()
      .withMessage("El campo esta_abierto debe ser verdadero o falso"),

    body("duracion_cita_minutos")
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage("La duración de la cita debe ser entre 15 y 480 minutos"),

    body("citas_maximas_por_dia")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Las citas máximas por día deben ser entre 1 y 50"),

    validate
  ],

  updateDay: [
    body("hora_apertura")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de apertura debe estar en formato HH:MM"),

    body("hora_cierre")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de cierre debe estar en formato HH:MM"),

    body("esta_abierto")
      .optional()
      .isBoolean()
      .withMessage("El campo esta_abierto debe ser verdadero o falso"),

    body("duracion_cita_minutos")
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage("La duración de la cita debe ser entre 15 y 480 minutos"),

    body("citas_maximas_por_dia")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Las citas máximas por día deben ser entre 1 y 50"),

    validate
  ],

  copyDay: [
    body("fecha_origen")
      .notEmpty()
      .withMessage("La fecha origen es requerida")
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("La fecha origen debe estar en formato YYYY-MM-DD"),

    body("fecha_destino")
      .notEmpty()
      .withMessage("La fecha destino es requerida")
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("La fecha destino debe estar en formato YYYY-MM-DD"),

    body("hora_apertura")
      .notEmpty()
      .withMessage("La hora de apertura es requerida")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de apertura debe estar en formato HH:MM"),

    body("hora_cierre")
      .notEmpty()
      .withMessage("La hora de cierre es requerida")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de cierre debe estar en formato HH:MM"),

    body("esta_abierto")
      .optional()
      .isBoolean()
      .withMessage("El campo esta_abierto debe ser verdadero o falso"),

    body("duracion_cita_minutos")
      .optional()
      .isInt({ min: 15, max: 480 })
      .withMessage("La duración de la cita debe ser entre 15 y 480 minutos"),

    body("citas_maximas_por_dia")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Las citas máximas por día deben ser entre 1 y 50"),

    validate
  ]
};

// Validaciones para citas
export const validateCita = {
  create: [
    body("taller_id")
      .notEmpty()
      .withMessage("El ID del taller es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID del taller debe ser un número entero positivo"),

    body("carro_id")
      .notEmpty()
      .withMessage("El ID del carro es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID del carro debe ser un número entero positivo"),

    body("tipo_cita")
      .notEmpty()
      .withMessage("El tipo de cita es requerido")
      .isIn(['evaluacion', 'reparacion', 'mantenimiento', 'consulta'])
      .withMessage("El tipo de cita debe ser: evaluacion, reparacion, mantenimiento o consulta"),

    body("fecha_cita")
      .notEmpty()
      .withMessage("La fecha de la cita es requerida")
      .isISO8601()
      .withMessage("La fecha debe estar en formato ISO 8601"),

    body("hora_inicio")
      .notEmpty()
      .withMessage("La hora de inicio es requerida")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de inicio debe estar en formato HH:MM"),

    body("hora_fin")
      .notEmpty()
      .withMessage("La hora de fin es requerida")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de fin debe estar en formato HH:MM"),

    body("descripcion_problema")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("La descripción del problema no puede exceder 1000 caracteres"),

    body("costo_estimado")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El costo estimado debe ser un número positivo"),

    body("telefono_contacto")
      .optional()
      .trim()
      .isLength({ min: 7, max: 20 })
      .withMessage("El teléfono debe tener entre 7 y 20 caracteres"),

    body("email_contacto")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Correo electrónico inválido"),

    validate
  ],

  update: [
    body("tipo_cita")
      .optional()
      .isIn(['evaluacion', 'reparacion', 'mantenimiento', 'consulta'])
      .withMessage("El tipo de cita debe ser: evaluacion, reparacion, mantenimiento o consulta"),

    body("fecha_cita")
      .optional()
      .isISO8601()
      .withMessage("La fecha debe estar en formato ISO 8601"),

    body("hora_inicio")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de inicio debe estar en formato HH:MM"),

    body("hora_fin")
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("La hora de fin debe estar en formato HH:MM"),

    body("estado")
      .optional()
      .isIn(['programada', 'confirmada', 'en_proceso', 'completada', 'cancelada', 'no_asistio'])
      .withMessage("El estado debe ser: programada, confirmada, en_proceso, completada, cancelada o no_asistio"),

    body("costo_estimado")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El costo estimado debe ser un número positivo"),

    body("costo_final")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El costo final debe ser un número positivo"),

    validate
  ],

  cancel: [
    body("motivo")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("El motivo no puede exceder 500 caracteres"),

    validate
  ],

  complete: [
    body("costo_final")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El costo final debe ser un número positivo"),

    body("notas_taller")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Las notas del taller no pueden exceder 1000 caracteres"),

    validate
  ],

  rate: [
    body("calificacion_atencion")
      .notEmpty()
      .withMessage("La calificación de atención es requerida")
      .isInt({ min: 1, max: 5 })
      .withMessage("La calificación de atención debe ser un número entre 1 y 5"),

    body("calificacion_calidad")
      .notEmpty()
      .withMessage("La calificación de calidad es requerida")
      .isInt({ min: 1, max: 5 })
      .withMessage("La calificación de calidad debe ser un número entre 1 y 5"),

    body("comentario_cliente")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("El comentario no puede exceder 500 caracteres"),

    validate
  ],

  updateEstado: [
    body("estado")
      .notEmpty()
      .withMessage("El estado es requerido")
      .isIn(['programada', 'confirmada', 'en_proceso', 'completada', 'cancelada', 'no_asistio'])
      .withMessage("El estado debe ser: programada, confirmada, en_proceso, completada, cancelada o no_asistio"),

    validate
  ]
};

// Validaciones para reparaciones
export const validateReparacion = {
  create: [
    body("evaluacion_id")
      .notEmpty()
      .withMessage("El ID de la evaluación es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID de la evaluación debe ser un número entero positivo"),

    body("tipo_reparacion")
      .notEmpty()
      .withMessage("El tipo de reparación es requerido")
      .isIn(['preventiva', 'correctiva', 'urgente'])
      .withMessage("El tipo de reparación debe ser: preventiva, correctiva o urgente"),

    body("componente")
      .trim()
      .notEmpty()
      .withMessage("El componente es requerido")
      .isLength({ min: 2, max: 100 })
      .withMessage("El componente debe tener entre 2 y 100 caracteres"),

    body("descripcion_problema")
      .trim()
      .notEmpty()
      .withMessage("La descripción del problema es requerida")
      .isLength({ min: 10, max: 1000 })
      .withMessage("La descripción del problema debe tener entre 10 y 1000 caracteres"),

    body("descripcion_solucion")
      .trim()
      .notEmpty()
      .withMessage("La descripción de la solución es requerida")
      .isLength({ min: 10, max: 1000 })
      .withMessage("La descripción de la solución debe tener entre 10 y 1000 caracteres"),

    body("prioridad")
      .optional()
      .isIn(['baja', 'media', 'alta', 'critica'])
      .withMessage("La prioridad debe ser: baja, media, alta o critica"),

    body("costo_estimado")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El costo estimado debe ser un número positivo"),

    body("tiempo_estimado_horas")
      .optional()
      .isFloat({ min: 0.5, max: 24 })
      .withMessage("El tiempo estimado debe ser entre 0.5 y 24 horas"),

    body("kilometraje_recomendado")
      .optional()
      .isInt({ min: 0 })
      .withMessage("El kilometraje recomendado debe ser un número entero positivo"),

    body("garantia_meses")
      .optional()
      .isInt({ min: 0, max: 60 })
      .withMessage("La garantía debe ser entre 0 y 60 meses"),

    validate
  ],

  update: [
    body("tipo_reparacion")
      .optional()
      .isIn(['preventiva', 'correctiva', 'urgente'])
      .withMessage("El tipo de reparación debe ser: preventiva, correctiva o urgente"),

    body("componente")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("El componente debe tener entre 2 y 100 caracteres"),

    body("descripcion_problema")
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("La descripción del problema debe tener entre 10 y 1000 caracteres"),

    body("descripcion_solucion")
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("La descripción de la solución debe tener entre 10 y 1000 caracteres"),

    body("prioridad")
      .optional()
      .isIn(['baja', 'media', 'alta', 'critica'])
      .withMessage("La prioridad debe ser: baja, media, alta o critica"),

    body("estado")
      .optional()
      .isIn(['pendiente', 'aceptada', 'rechazada', 'completada'])
      .withMessage("El estado debe ser: pendiente, aceptada, rechazada o completada"),

    body("costo_estimado")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El costo estimado debe ser un número positivo"),

    body("tiempo_estimado_horas")
      .optional()
      .isFloat({ min: 0.5, max: 24 })
      .withMessage("El tiempo estimado debe ser entre 0.5 y 24 horas"),

    validate
  ],

  accept: [
    body("proveedor_recomendado")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("El proveedor recomendado no puede exceder 100 caracteres"),

    validate
  ],

  reject: [
    body("motivo")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("El motivo no puede exceder 500 caracteres"),

    validate
  ],

  complete: [
    body("costo_final")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El costo final debe ser un número positivo"),

    body("notas_completado")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Las notas no pueden exceder 1000 caracteres"),

    validate
  ],

  createMultiple: [
    body("evaluacion_id")
      .notEmpty()
      .withMessage("El ID de la evaluación es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID de la evaluación debe ser un número entero positivo"),

    body("reparaciones")
      .notEmpty()
      .withMessage("El array de reparaciones es requerido")
      .isArray({ min: 1 })
      .withMessage("Debe proporcionar al menos una reparación"),

    body("reparaciones.*.tipo_reparacion")
      .notEmpty()
      .withMessage("El tipo de reparación es requerido para cada reparación")
      .isIn(['preventiva', 'correctiva', 'urgente'])
      .withMessage("El tipo de reparación debe ser: preventiva, correctiva o urgente"),

    body("reparaciones.*.componente")
      .trim()
      .notEmpty()
      .withMessage("El componente es requerido para cada reparación")
      .isLength({ min: 2, max: 100 })
      .withMessage("El componente debe tener entre 2 y 100 caracteres"),

    body("reparaciones.*.descripcion_problema")
      .trim()
      .notEmpty()
      .withMessage("La descripción del problema es requerida para cada reparación")
      .isLength({ min: 10, max: 1000 })
      .withMessage("La descripción del problema debe tener entre 10 y 1000 caracteres"),

    body("reparaciones.*.descripcion_solucion")
      .trim()
      .notEmpty()
      .withMessage("La descripción de la solución es requerida para cada reparación")
      .isLength({ min: 10, max: 1000 })
      .withMessage("La descripción de la solución debe tener entre 10 y 1000 caracteres"),

    validate
  ]
};

export default {
  validateTaller,
  validateEvaluacion,
  validateHorario,
  validateCita,
  validateReparacion
};
