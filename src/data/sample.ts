// Productos reales de la clienta (fichas en /assets). En la Fase 2 pasan a la base de datos.
// Nota: las fotos actuales son de baja resolución (~256 px); pedir los originales.
import type { StaticImageData } from "next/image";
import ceraDeVaso from "../../assets/cera-de-vaso1kg.png";
import fraganciaDulce from "../../assets/fragancia-dulce.png";
import moldeOso from "../../assets/molde-oso.png";
import velaVasito from "../../assets/vela-vasito.png";

export type Product = {
  slug: string;
  name: string;
  category: string;
  description: string;
  image: StaticImageData;
  imageAlt: string;
  price: number;
  /** "desde" cuando hay varias presentaciones */
  from?: boolean;
  /** Unidad o presentación del precio: "c/u", "1 kg", "30 ml"… */
  unit?: string;
  /** Dato extra corto: precio por mayor, advertencia, etc. */
  note?: string;
  badge?: string;
};

export const featuredProducts: Product[] = [
  {
    slug: "vela-vasito",
    name: "Vela vasito",
    category: "Velas y ambientadores",
    description:
      "Vela en envase de policarbonato con flor incrustada (puede cambiarse por otra figura) y delicioso aroma. Incluye caja y sticker en vinilo o transparente.",
    image: velaVasito,
    imageAlt: "Vela vasito con una rosa lila incrustada, junto a sus cajas con moño",
    price: 8000,
    unit: "c/u",
    note: "Docena: $84.000",
    badge: "Personalizable",
  },
  {
    slug: "cera-de-vaso-1kg",
    name: "Cera de vaso · 1 kg",
    category: "Ceras y aditivos",
    description:
      "70% cera de palma y 30% parafina, ideal para velas en recipientes. Punto de fusión: 50–56 °C.",
    image: ceraDeVaso,
    imageAlt: "Bolsa de cera de vaso de 1 kg con etiqueta Lusarte",
    price: 21000,
    unit: "1 kg",
    note: "20 kg: $340.000",
    badge: "Precio por mayor",
  },
  {
    slug: "molde-oso-tierno",
    name: "Molde oso tierno",
    category: "Moldes",
    description:
      "Moldes de osito para darle un toque diferente a tus velas. Medidas aproximadas: 4,5 × 3 × 3 cm.",
    image: moldeOso,
    imageAlt: "Molde de silicona verde junto a una vela en forma de osito",
    price: 27000,
  },
  {
    slug: "fragancia-dulce-tentacion",
    name: "Fragancia Dulce Tentación",
    category: "Fragancias · Gata Golosa",
    description:
      "Fresa jugosa, flor de vainilla y pétalos de rosa confitada sobre un fondo de vainilla cremosa y almizcle dulce.",
    image: fraganciaDulce,
    imageAlt: "Fragancia Dulce Tentación de La Gata Golosa, con fresas y pétalos de rosa",
    price: 10500,
    from: true,
    unit: "30 ml",
    note: "No compatible con parafina",
    badge: "Premium",
  },
];

// Respuestas provisionales: confirmar tiempos, cobertura y venta al por mayor con la clienta.
export const faqs = [
  {
    q: "¿Hacen envíos a toda Colombia?",
    a: "Sí. Enviamos a cualquier ciudad o municipio de Colombia con transportadora. El costo se calcula en el checkout según tu ciudad.",
  },
  {
    q: "¿Cuánto tarda en llegar mi pedido?",
    a: "Despachamos en 1 a 3 días hábiles. Una vez enviado, la entrega suele tardar de 2 a 5 días hábiles según tu ciudad. Te enviamos el número de guía por correo.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Tarjetas débito y crédito, PSE, Nequi y Botón Bancolombia, a través de la pasarela segura de Wompi.",
  },
  {
    q: "¿Cómo cuido mi vela para que dure más?",
    a: "En el primer encendido déjala prendida hasta que toda la superficie se derrita (unas 2 a 3 horas). Antes de cada uso corta la mecha a unos 5 mm y nunca la dejes encendida sin supervisión.",
  },
  {
    q: "¿Venden insumos al por mayor?",
    a: "Sí, manejamos precios especiales para emprendimientos y talleres. Escríbenos por WhatsApp con lo que necesitas y te enviamos una cotización.",
  },
];
