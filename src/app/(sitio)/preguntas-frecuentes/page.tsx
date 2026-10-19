import type { Metadata } from "next";
import { InfoPage } from "@/components/store/InfoPage";
import { faqs } from "@/data/faqs";
import { whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Envíos, tiempos de entrega, pagos, cuidado de las velas y compras al por mayor en Lusarte.",
  alternates: { canonical: "/preguntas-frecuentes" },
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <InfoPage title="Preguntas frecuentes">
      {faqs.map((f) => (
        <section key={f.q}>
          <h2>{f.q}</h2>
          <p className="mt-1">{f.a}</p>
        </section>
      ))}
      <p>
        ¿Tienes otra pregunta?{" "}
        <a href={whatsappUrl("¡Hola Lusarte! Tengo una pregunta.")} target="_blank" rel="noopener noreferrer">
          Escríbenos por WhatsApp
        </a>
        .
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />
    </InfoPage>
  );
}
