import { GymEquipmentItem } from '../types/workout';

export const COMPANY_GYM_EQUIPMENT: GymEquipmentItem[] = [
  {
    id: 'multipower',
    name: 'Multipower (barra guiada)',
    category: 'maquina',
    specs: 'Barra guiada + discos + banco regulable',
    available: true,
  },
  {
    id: 'polea_torre',
    name: 'Torre polea alta y baja',
    category: 'maquina',
    specs: 'Placas hasta 100 kg · barra ancha, triángulo y agarre D',
    available: true,
  },
  {
    id: 'maquina_pierna',
    name: 'Máquina de pierna dual',
    category: 'maquina',
    specs: 'Extensión cuádriceps y curl femoral · hasta 70 kg',
    available: true,
  },
  {
    id: 'mancuernas',
    name: 'Torre de mancuernas',
    category: 'peso_libre',
    specs: 'Pares hasta 10 kg cada una',
    available: true,
  },
  {
    id: 'banco_lumbar',
    name: 'Banco hiperextensiones 45°',
    category: 'peso_libre',
    specs: 'Espalda baja, glúteo e isquios seguros',
    available: true,
  },
  {
    id: 'banco_regulable',
    name: 'Banco regulable + abs',
    category: 'peso_libre',
    specs: 'Plano, inclinado y declinado con rodillos',
    available: true,
  },
  {
    id: 'bandas_accesorios',
    name: 'Bandas, palo y colchoneta',
    category: 'accesorio',
    specs: 'Bandas elásticas, palo movilidad, rueda abdominal',
    available: true,
  },
  {
    id: 'suspension_espaldera',
    name: 'Correas suspensión + espaldera',
    category: 'accesorio',
    specs: 'Anclaje TRX, espaldera de madera y barra alta',
    available: true,
  },
  {
    id: 'cardio_zona',
    name: 'Cardio (bici, elíptica, cinta)',
    category: 'cardio',
    specs: 'Ideal para los 3-5 min de calentamiento articular',
    available: true,
  },
];
