---
id: DEC-003
title: "The user chooses and sets up each outside service"
date: 04-11-2026
status: decided
research: "dev/mvp/research/outside-services.md"
affects: "FR-066, FR-088, FR-117, NFR-007"
---

## Question

**Who chooses the outside services** that DeckAgent uses besides the provider of the selected model, such as a web search service or an image service? The legacy spec said "**an outside service that the Product Owner approved**" (legacy FR-088, NFR-007).

## Options considered

| Option | Description | Fits which requirements | Tradeoffs |
|---|---|---|---|
| A · Supported list | The team keeps a closed list of services DeckAgent integrates; the user picks one from it and brings the key | FR-088, FR-117, NFR-007 | The privacy promise names each service; new services wait for the team |
| B · Team-fixed | The team picks one service per kind; the user does not choose | FR-088 | Simplest; against "your model, your key"; neither reference product does it |
| C · User-chosen | The user chooses and sets up any service, with their own account or key, as open-design does with a custom API | FR-066, FR-088, FR-117, NFR-007 | Most freedom; the privacy promise covers only the services the user set up, and cannot name them in advance |

## Choice

Option C: the **user chooses and sets up each outside service**.

## Why

The PO's ruling of 04-11-2026: "**the user chooses, like open-design**". It matches "**your model, your key**" in `README.md`. **Neither open-design nor DeepSeek Harness keeps a team-approved list** (`dev/mvp/research/outside-services.md` items 3, 5, 8).

## Rejected options and why

- A: a **team-kept list adds a gate** that **neither reference product has** and that the **user cannot change**.
- B: it **takes the choice of service**, and of **who sees the user's content**, **away from the user**.

## Consequences

- FR-088, FR-117, NFR-007 and the glossary say "**an outside service the user set up**" instead of "the owner approved".
- **How the user sets up a service and its key** is reviewed with legacy UC-005.
- **FR-090 still holds**: public research **sends no private content**, **whichever service** the user set up.
- The project documentation **lists each kind of outside connection**, **not each service**.
