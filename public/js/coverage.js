export const insuranceOptions = [
  'SIS', 'EsSalud', 'EPS', 'Seguro privado', 'Pago directo', 'SOAT', 'SCTR', 'No lo sé'
];

export const essaludPlans = [
  'Seguro Regular (+SEGURO)',
  'Seguro Potestativo (+SALUD)',
  'Seguro Agrario',
  'SCTR (+PROTECCIÓN) · riesgos del trabajo',
  '+VIDA · indemnización por accidente',
  'No conozco mi plan'
];

export const coverageGuide = {
  SIS: {
    text: 'Consulta en Conect@SIS si tu afiliación está activa y qué establecimiento figura en tu registro. Para atención de primer nivel también puedes acudir a otros establecimientos del primer nivel del Minsa.',
    steps: [
      'Ten a mano tu DNI o carné de extranjería para consultar tu afiliación.',
      'Pregunta al centro cómo solicitar el servicio. Si necesitas un especialista, consulta si te corresponde una referencia.',
      'Confirma con admisión la fecha y los documentos que debes llevar.'
    ],
    url: 'https://www.gob.pe/97742-plataforma-conect-sis-servicio-de-consulta-en-linea'
  },
  EsSalud: {
    text: 'Para una consulta programada, empieza por el centro que EsSalud te asignó. Allí pueden derivarte a otra sede si necesitas una especialidad.',
    steps: [
      'Verifica tu acreditación y tu centro asignado en EsSalud.',
      'Ten tu documento de identidad a mano y solicita la cita por el canal indicado por tu centro.',
      'Si tienes +PROTECCIÓN, revisa la guía SCTR para casos laborales. +VIDA otorga una indemnización en los supuestos de accidente previstos por el seguro.'
    ],
    url: 'https://www.gob.pe/institucion/essalud/pages/277-sacar-una-cita-medica-en-essalud'
  },
  EPS: {
    text: 'Una entidad prestadora de salud (EPS) complementa la atención de EsSalud. Tu plan indica en qué sedes puedes atenderte y cuánto te corresponde pagar.',
    steps: [
      'Busca el nombre de la EPS y de tu plan en tu constancia o consúltalos con tu empleador.',
      'Pregunta a tu EPS si la sede y la especialidad están en tu red y qué parte pagarás tú.',
      'Antes de acudir, confirma con la sede si el servicio requiere una orden o autorización.'
    ],
    url: 'https://www.pj.gob.pe/wps/wcm/connect/bienestarsocial/s_bien_social/as_seguros/as_eps'
  },
  'Seguro privado': {
    text: 'La póliza de tu aseguradora indica qué prestaciones cubre y qué gastos corresponden al paciente.',
    steps: [
      'Identifica tu aseguradora y el nombre del plan.',
      'Consulta a la aseguradora por la sede, la especialidad, los límites y el importe a tu cargo.',
      'Pregunta si hay pago directo a la clínica o reembolso, y qué documentos debes conservar.'
    ],
    url: 'https://www.sbs.gob.pe/usuarios/seguro-de-salud'
  },
  'Pago directo': {
    text: 'En una consulta particular tú pagas la atención. La sede te indica el precio vigente y cómo reservar.',
    steps: [
      'Consulta en admisión si reciben pacientes particulares para el servicio que buscas.',
      'Pregunta el precio y si los análisis, procedimientos o controles se cobran por separado.',
      'Confirma el medio de pago, el documento que debes llevar y la hora de llegada.'
    ],
    url: 'https://www.gob.pe/10423-derechos-de-las-personas-usuarias-de-los-servicios-de-salud'
  },
  SOAT: {
    text: 'El SOAT cubre a las personas afectadas por un accidente de tránsito, incluidos los peatones. Si es una emergencia, busca atención inmediata.',
    steps: [
      'Informa al establecimiento que las lesiones ocurrieron en un accidente de tránsito.',
      'Si los tienes a mano, facilita la placa del vehículo y los datos de la aseguradora.',
      'Para controles posteriores por el accidente, pregunta dónde continuar la atención y qué documentación presentar.'
    ],
    url: 'https://www.gob.pe/es/202-seguro-obligatorio-de-accidentes-de-transito-soat'
  },
  SCTR: {
    text: 'El Seguro Complementario de Trabajo de Riesgo tiene una cobertura de salud para accidentes laborales y enfermedades profesionales de trabajadores asegurados.',
    steps: [
      'Si el caso es una emergencia, busca atención inmediata.',
      'Informa a tu empleador y averigua qué entidad brinda tu cobertura SCTR de salud.',
      'Para el seguimiento, confirma con esa entidad el centro de atención y los datos del reporte laboral que necesita.'
    ],
    url: 'https://www.gob.pe/454-seguro-complementario-de-trabajo-de-riesgo-de-essalud-proteccion-cobertura'
  },
  'No lo sé': {
    text: 'El servicio Resuelve de SUSALUD te permite consultar con qué seguro de salud figuras registrado.',
    steps: [
      'Abre la consulta oficial de SUSALUD y ten a mano tu documento de identidad.',
      'Revisa el nombre de la entidad que aparece en el resultado.',
      'Contacta con esa entidad para confirmar tu centro y saber cómo pedir la cita.'
    ],
    url: 'https://www.gob.pe/institucion/susalud/pages/10192-conocer-si-cuentas-con-un-seguro-de-salud-resuelve'
  }
};
