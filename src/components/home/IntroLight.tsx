"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Solo se reproduce en la primera carga; al volver al inicio navegando no se repite.
let played = false;

/** Capa oscura que se "enciende" desde el lettering del hero ([data-intro-origin]). */
export function IntroLight() {
  const [show, setShow] = useState(!played);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Hay un lettering por tamaño de pantalla; usa el que está visible
    const origin = [...document.querySelectorAll("[data-intro-origin]")].find(
      (el) => el.getBoundingClientRect().width > 0,
    );
    if (!origin || !ref.current) return;
    const r = origin.getBoundingClientRect();
    ref.current.style.setProperty("--x", `${r.left + r.width / 2}px`);
    ref.current.style.setProperty("--y", `${r.top + r.height / 2}px`);
    ref.current.classList.add("listo");
  }, []);

  if (!show) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="intro-luz"
      onAnimationEnd={() => {
        played = true;
        setShow(false);
      }}
    />
  );
}
