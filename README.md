# HAXR Signature

Website institucional premium para a HAXR Signature — assessoria executiva de eventos em Maputo, Moçambique.

## Stack

- **Next.js 15** (App Router)
- **Tailwind CSS 4**
- **GSAP + ScrollTrigger** — animações de scroll
- **Lenis** — scroll cinematográfico
- **Framer Motion** — transições de UI
- **SplitType** — animação editorial de texto
- **tsParticles** — partículas douradas no hero
- **React Hook Form + Zod** — formulário de contacto

## Comandos

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

## Deploy

Optimizado para [Vercel](https://vercel.com). Ligar o repositório e fazer deploy automático.

## Formulário

Substituir `YOUR_FORM_ID` em `src/components/sections/Contact.tsx` pelo ID do [Formspree](https://formspree.io).

O convite em destaque está configurado em `src/lib/site-config.ts` (`featuredInvitation`).
