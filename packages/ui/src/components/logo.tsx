import { type ComponentProps } from "solid-js"

// Misci mark — a clean-monoline "M" monogram. Three strokes only: two uprights
// and a valley, drawn with round joins so it stays soft at 16px.
export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.8 4V16"
        stroke="var(--icon-strong-base)"
        stroke-width="2.2"
        stroke-linecap="round"
      />
      <path
        d="M13.2 4V16"
        stroke="var(--icon-strong-base)"
        stroke-width="2.2"
        stroke-linecap="round"
      />
      <path
        d="M5.1 4L8 16L10.9 4"
        stroke="var(--icon-strong-base)"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 20V80"
        stroke="var(--icon-base)"
        stroke-width="11"
        stroke-linecap="round"
      />
      <path
        d="M66 20V80"
        stroke="var(--icon-base)"
        stroke-width="11"
        stroke-linecap="round"
      />
      <path
        d="M25.5 20L40 80L54.5 20"
        stroke="var(--icon-base)"
        stroke-width="11"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export const Logo = (props: { class?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 42"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <g transform="translate(4 3) scale(1.8)">
        <path
          d="M2.8 4V16"
          stroke="var(--icon-strong-base)"
          stroke-width="2.2"
          stroke-linecap="round"
        />
        <path
          d="M13.2 4V16"
          stroke="var(--icon-strong-base)"
          stroke-width="2.2"
          stroke-linecap="round"
        />
        <path
          d="M5.1 4L8 16L10.9 4"
          stroke="var(--icon-strong-base)"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <text
        x="42"
        y="29"
        font-family="'Inter', system-ui, sans-serif"
        font-size="20"
        font-weight="600"
        letter-spacing="4"
        fill="var(--icon-strong-base)"
      >
        MISCI
      </text>
    </svg>
  )
}