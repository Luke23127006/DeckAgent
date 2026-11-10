---
name: DeckAgent Local Web
description: A macOS-style glass window over a soft wallpaper gradient, with a translucent sidebar, one system blue, and light, dark or system theme.
colors:
  ink: "#1d1d1f"
  ink-muted: "#5f5f65"
  accent: "#0066cc"
  accent-text: "#005bb8"
  accent-soft: "rgba(0, 102, 204, 0.12)"
  ok: "#17692f"
  err: "#c4001a"
  window-tint: "rgba(255, 255, 255, 0.38)"
  side: "rgba(244, 245, 250, 0.45)"
  content: "rgba(255, 255, 255, 0.6)"
  card: "rgba(255, 255, 255, 0.74)"
  edge: "rgba(255, 255, 255, 0.75)"
  line: "rgba(60, 60, 67, 0.14)"
  fill: "rgba(60, 60, 67, 0.07)"
  dark-ink: "#f5f5f7"
  dark-ink-muted: "#a8a8b0"
  dark-accent: "#6bb6ff"
  dark-accent-fill: "#0a6ede"
  dark-ok: "#4cd68a"
  dark-err: "#ff7a68"
  dark-window-tint: "rgba(20, 22, 34, 0.45)"
  dark-side: "rgba(18, 20, 32, 0.5)"
  dark-content: "rgba(26, 28, 42, 0.62)"
  dark-card: "rgba(48, 50, 70, 0.78)"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI Variable Text', 'Segoe UI', system-ui, 'Helvetica Neue', 'Noto Sans', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  chrome:
    fontSize: "13px"
    fontWeight: 500
  meta:
    fontSize: "12px"
  title:
    fontSize: "20px"
    fontWeight: 600
  mono:
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Mono', Consolas, monospace"
    fontSize: "12px"
rounded:
  control: "8px"
  row: "10px"
  panel: "16px"
spacing:
  header-height: "52px"
  rail-width: "236px"
  deck-width: "400px"
components:
  window:
    backgroundColor: "{colors.window-tint}"
  rail:
    backgroundColor: "{colors.side}"
    textColor: "{colors.ink}"
    width: "{spacing.rail-width}"
    padding: "14px 10px"
  conversation:
    backgroundColor: "{colors.content}"
    textColor: "{colors.ink}"
  button:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "4px 14px"
    height: "30px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
  message-user:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "18px"
    padding: "8px 14px"
  composer:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "12px 14px 10px"
  request-record:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
    height: "34px"
  request-record-awaiting:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
  deck-sidebar:
    backgroundColor: "{colors.side}"
    textColor: "{colors.ink}"
    width: "{spacing.deck-width}"
    padding: "16px"
---

# Design System: DeckAgent Local Web

## Overview

**Creative North Star: "The Glass Window"**

The app is one glass window that fills the whole screen edge to edge, over a soft wallpaper, in the manner of a macOS app. The sidebar and the deck panel are translucent and let the wallpaper tint through; the conversation sits on a more opaque layer so reading stays easy. Controls are small light-glass pills and rectangles with a hairline edge. One color, the system blue, marks the main action and your own messages.

The direction follows the "Liquid Glass" guidance: glass for navigation and controls, content on a separate, calmer layer, colour used sparingly, and a solid fallback when transparency is off.

The theme has three choices: **Sáng** (light), **Tối** (dark) and **Hệ thống** (follow the system). The Host keeps the choice (`GET/PUT /api/preferences`, stored in `web.sqlite`) and `/theme.js` applies it before first paint. Nothing is kept in browser storage, so a changed local port or a different browser keeps the same theme. If saving fails, the control goes back to the saved choice and shows a hover message.

**Key characteristics:**
- Fixed wallpaper behind the window made of soft-edged colour orbs (pink, violet, sky, mint and amber in light; magenta, cobalt, teal and rose in dark). The window blurs 48px at 1.9 saturation, so the orbs show as frosted shapes through the sidebar, content and deck. A rim highlight (`#app::after`, `--rim`) lights the top-left edge.
- One blur layer for the whole window (`#app::before`); everything inside is a translucent tint over it. Tints are kept light enough for the blur to read, and heavy enough that text stays at 4.5:1 over the strongest orb (light: window .2 + sidebar .38; dark: window .3 + sidebar .45).
- Sidebar and deck: lighter tint. Conversation and settings: more opaque tint. Composer, popover and menus: strongest tint.
- 1px white edge and a hairline on glass; soft large shadow under the window and the popovers.
- Radii: 8px controls, 10px rows, 16px panels; user bubbles 18px. The window itself has no radius.
- State is a drawn mark plus a text label plus a color, never color alone.
- Every icon and mark is drawn in CSS because the host CSP blocks images. The icon set is one family of thin line icons: 1.75px stroke, rounded ends, no filled polygons. Chevrons are rotated border corners (down, up, left, right; the disclosure chevron turns 90° when opened), the send arrow is a rounded stem plus a chevron head, plus and close are crossed bars, the model-settings icon is two sliders with ring knobs, the sidebar toggle is a rounded panel with a divider, and the app icon is a blue squircle with three text lines. System fonts only.
- Motion is short and purposeful (see Motion); reduced motion keeps only a 150ms fade and drops all movement; reduced transparency (or no `backdrop-filter`) switches every glass layer to a solid color.

## Colors

Neutrals plus one blue.

- **Ink / Muted ink**: all text; both pass 4.5:1 on the lightest and darkest glass over the wallpaper in both themes.
- **Accent** (`accent`, `accent-fill`): blue fill for the primary action, the new-chat button, your messages, the send button and Save. **Accent text** (`accent-text`; dark `dark-accent`) is the text and ring blue, chosen to pass 4.5:1 on glass.
- **Accent soft**: the tint of the one block waiting for the user (the request row and the waiting chip).
- **Glass layers** (`window-tint`, `side`, `content`, `card`, `edge`, `line`, `fill`): translucent whites in light, translucent indigo-blacks in dark. Solid fallbacks live in `--s-*` tokens.
- **OK / Error**: completed mark, failed mark and failed label only.

### Named Rules

**The One Blur Rule.** Blur lives on the window layer and on floating surfaces (popover, menus, outline card, wizard). Never put `backdrop-filter` on an ancestor of the model picker: the fixed popover would move.

**The Mark Beside Color Rule.** Every state color travels with a drawn mark and a text label.

**The One Waiting Block Rule.** At most one blue-tinted block is on screen.

## Typography

System sans only. Four sizes: 15px content, 13px chrome, 12px meta and 20px for the welcome heading. Titles in the header and panels are 13px, weight 600. Mono (12px) appears only in tool output and model chips. Request codes and captions use tabular numerals.

## Layout

One full-bleed window, no margin, border or radius: sidebar (236px), conversation (flexible, minimum 320px) and deck (400px, resizable up to 70vw), separated by hairlines. The header is 52px. The conversation and composer share a 760px column.

From 721 to 1000px the sidebar is 206px and the deck may shrink to 260px. At 720px and below the window stacks; the theme switch and the model-settings icon form a third row of the top area; buttons grow to 44px touch targets.

## Sidebar behaviour

The sidebar follows the Claude app. The top row holds the wordmark and a toggle (a drawn panel icon). Below it come **Chat mới** (a blue circle with a plus) and the **Gần đây** list. At the bottom is one trigger row, **Cài đặt**, with a round blue avatar that carries the sliders icon and a chevron. It opens a glass menu above it (below it on a phone, where the sidebar is a top strip) with: a muted line "Chạy trên máy của bạn", **Cài đặt model**, the **Giao diện** switch (Sáng, Tối, Hệ thống) and **Kết nối lại / đọc lịch sử** (formerly the "…" menu in the header, now removed). The developer-tools group that opened the sample deck is gone from the menu. The menu closes on Escape, on any press outside it, and after choosing an action. The toggle folds the whole sidebar into a 64px rail that keeps the toggle, the new-chat icon and the avatar trigger. The fold state is kept per browser in `localStorage` (`deckagent-nav`), like the deck width, and is ignored at 720px and below. Model choice stays in the composer.

## Motion

Motion is expressive on purpose: the interface should feel alive at the moments a user notices. It is built with anime.js (bundled into the browser client, so the CSP needs no outside script) in `packages/client/runtime/src/motion.ts`. That module watches the page with a `MutationObserver`, so the views stay unaware of it. Everything uses `transform`, `opacity`, `clip-path` and a short `box-shadow` ring; nothing animates layout except the sidebar width.

- **First load:** the sidebar rows slide in one after another (60ms apart), then the header drops in and the composer rises and scales up. A soft sheen sweeps across the glass once.
- **Sending:** your message flies up from the composer with a spring (about 0.3 bounce), so a send reads as a physical throw. A reply, a request row or a slide link rises 14px with a lighter spring. Opening a chat with a long history fades its messages in with a short stagger instead, so a long chat never plays a long animation.
- **Request state changes:** completed gives a green ring and a small swell; waiting for you pulses a blue ring three times; failed shakes sideways and flashes a red ring.
- **Menus:** the account menu springs open from the trigger (scale from .9, 0.28 bounce) and its rows slide in one by one. The model popover scales and fades from its corner.
- **Welcome text:** each letter of the heading rises and fades in, 22ms apart. The plain heading is restored afterwards, with an `aria-label` meanwhile.
- **Deck:** the deck panel is revealed from the left edge to the right with a clip, never moved, because the resize divider must stay under the pointer. A newly saved slide thumbnail pops in with a spring, and a thumbnail that finishes (pending to saved) sends out a ring. A slide change scales and fades the slide in.
- **Canvas:** moving to the next slide slides the stage in from the right (40px, 440ms), moving back slides it in from the left; the first slide of a chat, or one reached after a reload, swells in instead. The counter ("2 / 5") rolls 9px up or down by the direction of the change. A thumbnail preview fades in when it arrives. The filmstrip scrolls smoothly to keep the current tile in view, and the ring on the current tile eases over in 180ms (CSS). **Trình chiếu** swells the stage from 94% and lifts the control pill 18px after a 260ms pause. The pill is centred with auto margins, not a transform, so the script animation does not fight it. The fade of the idle pill stays CSS. These run under the same rule as the rest: nothing here moves layout, and reduced motion drops all of it.
- **Theme switch:** the new theme opens as a circle from the control that was pressed (a view transition clipped with the Web Animations API), 700ms. The segment indicator slides between the three choices in 220ms.
- **Press feedback:** every button scales to 97% in 140ms (CSS). The sidebar width eases in 220ms. The account chevron turns when the menu is open.
- **Not animated, by decision:** keyboard actions, hover colour, chat switching and anything repeated many times a day. No always-running loops and no blur filters on animated elements: the window already blurs its backdrop, and a moving layer above it is expensive.
- **Reduced motion:** `initMotion` does nothing, the CSS fallback shows a 150ms fade only, and the press scale and view transition are off. Without the script (or when it is off) the same elements get plain CSS transitions.

## Elevation

The window carries a large soft shadow and an inner top highlight. Popover, menus and the setup dialog use a soft shadow and a hairline. Buttons and the composer have a 1px lift.

## Components

- **Request record.** A quiet 34px row: mark, muted code ("Yêu cầu n", `#n` when narrow), state label. Marks: green dot (completed), turning blue ring (running), blue bars (awaiting; the row takes the blue tint), hollow ring (stopped), dashed ring (interrupted), red X (failed). Only failed and interrupted rows open.
- **Buttons.** Light glass with a hairline and 1px lift; hover and press are a translucent overlay; primary is solid blue; ghost has no edge. Focus is a 2px blue ring.
- **Fields.** Light glass, 8px radius; focus shows a blue border and soft halo.
- **Composer.** 16px glass panel; blue ring on focus-within; send is a blue circle; the model picker is plain muted text with a chevron.
- **Outline actions and clarification question.** A glass panel: blue confirm, light-glass revise, blue-text cancel.
- **Theme switch.** A segmented control in a gray track; the active segment is raised white (dark: raised translucent).
- **Settings popup (Cài đặt model).** A modal glass card (`--card` tint, `--blur`, white edge, `--pop` shadow over a `--scrim`), 880 by 660px at most and 94vw by 88dvh on small windows; the chat stays visible behind it. The header holds the title (15px, weight 600) and a round close mark on the right. The body is two columns, as in the Claude app: a left column on a `--fill` tint with **Provider đã lưu** (name and key state, the open one raised with `--selected`) and **Thêm provider** (a drawn plus and one row per unsaved built-in, then Custom model API); a right column with the provider name as a 20px page title, the key status line, then the Kết nối, API key and Model sections, and a footer with **Xóa cấu hình** on the left and **Hủy** and the blue **Lưu** on the right. Escape, the close mark and a press on the scrim all leave through the same unsaved-changes check. At 720px and below the popup fills the screen and the left column becomes a scrolling strip of provider chips above the form. The three-step wizard (Thêm provider · 1/3) reuses the same dialog as a narrow single column without the left column.
- **Deck panel.** The canvas is one dark-or-light viewer surface (`--vw-*` tokens: black in dark mode, a soft light glass in light mode, so the slide never sits in a black hole on a light window). The stage fills the top and fits the slide 16:9 with letterbox bars. A bar under it holds Trước, the counter ("2 / 3"), Sau and **Về đầu** with an `R` key hint. The filmstrip runs along the bottom on the same surface: each tile is the saved slide rendered at 1280px and scaled down, its number sits in the bottom-left corner of the tile in white, and the current tile has a 2px ring in the viewer's ink colour. **Trình chiếu** is the one blue pill in the panel header. A preview is fetched only when its tile scrolls into view, three at a time, and is cached by slide and revision; it runs in the same empty-sandbox iframe and CSP as the stage. A pending tile is dashed and empty. The saved-slide count ("2/3 slide đã lưu") and the slide caption are visually hidden but stay for screen readers. There is no footer note: the connection line appears as a quiet `--fill` card only when the connection is not healthy. None of these layers uses `backdrop-filter`.
- **Present mode.** **Trình chiếu** puts the panel itself in fullscreen. The header, the rail and the connection line disappear, the slide fills a black screen at 16:9, and the controls become a dark pill at the bottom centre with **Thoát**. The pill and the cursor fade after 2.5s without pointer movement and come back on any movement or key. The slide iframe ignores the pointer here, so a click on the stage goes back (left 30%) or forward (the rest). Keys work while focus is inside the panel: arrows, PageUp/PageDown, Space, Home/End and `R` (first slide); Esc leaves through the browser. Keys are handled on the panel, never on the window, so the composer keeps its own keys.

## Do's and Don'ts

### Do:
- Keep content on the calmer layer and glass on navigation and controls.
- Keep text at 4.5:1 or better on glass in both themes.
- Draw icons in CSS with clip-path, gradients or borders.
- Provide the solid fallback for reduced transparency.

### Don't:
- Don't stack extra blur layers on big containers; one window blur is enough.
- Don't use `backdrop-filter` on `.conversation`, `.composer-dock` or `.composer`.
- Don't fake window chrome such as traffic-light buttons.
- Don't request a web font, image or other outside asset.

## Notes

- Literal colors outside the tokens, on purpose: `#fff` slide paper, `#d8d8dc` thumbnail bars, the blue gradient on the wordmark icon.
- Not verified: the running mark was not captured; widths other than 390px and 900px were not checked; the reduced-transparency fallback was not exercised in a browser.
- The `requestFullscreen` steps of two smoke tests fail in this environment with every earlier version of the CSS as well.
