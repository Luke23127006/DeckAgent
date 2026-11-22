# DeckAgent presentation content

## Language

**SlideDocument**: The versioned content of one generated slide, with stable content nodes, prepared image references, content origins and presenter notes. It is independent of a file format.

**Native artifact**: A representation of a SlideDocument in a chosen format, bound to its content revision, template and validation policy.

**Executable template**: A versioned collection of runnable layout skeletons, visual roles, content limits and instructions used to create a native artifact.

**Prepared image**: An immutable local image whose bytes, origin and licence metadata are available before an execution plan is confirmed.

**Image need**: The subject, role and constraints of an image at one position in a planned slide.

**Image candidate**: An image returned by an admitted public search, with source information available for assessing its fit and use licence. Finding a candidate does not select it for a deck.
