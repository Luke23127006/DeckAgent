# Project Structure

Đọc file này để biết cấu trúc source code mục tiêu của DeckAgent: component nào sở hữu trách nhiệm nào, code mới đặt ở đâu và component nào được phụ thuộc vào component nào.

File này mô tả kiến trúc mà repo refactor tới, không mô tả code hiện tại. Code mới đặt theo file này. Không tạo folder rỗng: chỉ tạo folder khi có code thuộc trách nhiệm của folder đó. Cách viết code nằm trong [Coding Guidelines](code.md). Cách viết test nằm trong [Testware](testware.md).

## Nguyên tắc

### Strict boundaries, flexible implementation

Mỗi application, package và folder có một trách nhiệm xác định. Mỗi component trả lời một câu hỏi, sở hữu một tập hành vi, state hoặc contract, và không sở hữu trách nhiệm của component khác.

Không tạo class, interface, layer, package hoặc folder chỉ để theo một template. Không tạo `shared`, `common`, `utils` hoặc `errors` chung để né dependency boundary *(review)*.

### Runtime ownership

DeckAgent là local application. Browser UI và Local Host là hai execution environment của cùng một application. HTTP/SSE trên localhost là transport nội bộ giữa hai môi trường này. DeckAgent không phải hosted backend.

- Browser sở hữu UI, browser state và user interaction.
- Local Host sở hữu application workflow, local runtime và quyền truy cập local capability (filesystem, process, SQLite).
- Package sở hữu một domain hoặc một capability có trách nhiệm độc lập.
- Entry point của application nối các concrete implementation và quản lý lifecycle.

Xác định owner theo trách nhiệm trước, sau đó mới xét runtime. Code liên quan tới giao diện không tự động thuộc Browser. Code chạy trên Node.js không tự động thuộc Local Host.

### Authority

Mỗi state có đúng một authoritative owner. Component khác chỉ thay đổi state đó qua public operation của owner *(review, test)*.

| Owner | Quyết định | Không quyết định |
| --- | --- | --- |
| Domain package | Domain invariant, state transition | Workflow xuyên nhiều domain |
| Persistence owner | Durable record, transaction trong phạm vi của nó | Request execution |
| Application workflow | Thứ tự gọi operation của nhiều owner, failure policy của operation xuyên owner | Private state của owner |
| Request Lifecycle | Request execution state, cancellation, terminal status | HTTP semantics |
| Agent Runtime | Cách thực thi agent | Terminal status của request |
| Tool permission authority | Capability cấp cho một request | Cách thực thi tool |
| Tool executor | Thực thi operation trong capability đã cấp | Cấp thêm capability |
| Local Transport | Chuyển đổi giao tiếp giữa Browser và Local Host | Domain policy |

### Khi nào tạo folder hoặc package

Ưu tiên đặt code vào owner hiện có.

- Tạo folder khi một trách nhiệm nội bộ cần tách riêng và có ownership, exclusion và dependency rõ ràng.
- Tạo package khi component cần public contract và dependency boundary riêng. Package mới phải có consumer cụ thể hoặc một dependency cần chặn.
- Không tạo package chỉ vì số file tăng, vì một feature cần code của feature khác, vì muốn có một layer theo Clean Architecture, hoặc vì muốn đặt interface vào một chỗ chung.

Khi hai component cần import lẫn nhau, xem lại ownership và chiều phụ thuộc trước khi tạo abstraction hoặc package mới.

## Cấu trúc tham chiếu

```text
apps/web/
  src/
    browser/            UI chạy trong Browser
      features/
      transport/
    features/           application workflow trên Local Host
    integrations/
      opencode/
    index.ts            startup, shutdown, wiring
  tests/
packages/
  host/api/
  host/contracts/
  presentation/{deck,design,document,html,pptx}/
  session/persistence/
  workspace/registry/
  tools/filesystem/
  <group>/<package>/tests/
e2e/
scripts/
```

Cột "Không sở hữu" chỉ ghi các trách nhiệm dễ bị đặt nhầm vào component đó.

### `apps/web/`

| Path | Câu hỏi | Sở hữu | Không sở hữu |
| --- | --- | --- | --- |
| `apps/web/` | Local application được tổ chức và vận hành thế nào? | Workflow riêng của application, Browser UI, local communication, adapter chỉ application dùng | Domain invariant và private persistence của package |
| `src/browser/` | Người dùng tương tác với DeckAgent thế nào? | UI, UI-local state, navigation. `features/` nhóm UI theo product feature khi cần | Request execution authority, filesystem, SQLite, agent process |
| `src/browser/transport/` | Browser gọi Local Host thế nào? | HTTP/SSE client, serialize request, decode response, ánh xạ lỗi HTTP/SSE sang mã lỗi typed của client. Thông báo lỗi cho người dùng thuộc `src/browser/` hoặc `src/browser/features/` | Permission policy, Request Lifecycle, domain state transition, bảng văn bản lỗi UI |
| `src/features/` | Application phối hợp các owner thế nào để hoàn thành một use case? | Application workflow, operation xuyên owner, application-level failure policy | Domain invariant của package, xử lý HTTP request/response, DOM |
| `src/integrations/` | Application giao tiếp với external runtime hoặc service thế nào? | Protocol adapter, process lifecycle, external client. `opencode/` sở hữu process và protocol của OpenCode | Admission policy, domain invariant, terminal status của request, permission |
| `src/index.ts` | Application khởi động và tắt thế nào? | Startup, shutdown, wiring concrete dependency, configuration, đăng ký capability và adapter | Domain operation, business rule của feature |

Feature không bắt buộc có `service.ts`, `controller.ts` hoặc `repository.ts`. Không tạo folder `composition/` khi `index.ts` đã đủ cho wiring.

### `packages/`

| Path | Câu hỏi | Sở hữu | Không sở hữu |
| --- | --- | --- | --- |
| `host/api/` | Local Host nhận command và quản lý request execution thế nào? | Local HTTP/SSE transport và HTTP framing (readJson, giới hạn kích thước body, multipart, header, xác thực, ánh xạ HTTP status), route dispatch, Request Lifecycle, request event, approval coordination | Browser UI, Deck invariant, process của OpenCode, SQLite implementation của Session, decode payload wire JSON thuần (thuộc host/contracts/), runtime của domain package (chỉ import type-level reader port) |
| `host/contracts/` | Browser và Local Host trao đổi dữ liệu theo contract nào? | Wire DTO, event envelope, protocol error payload, bộ decode và kiểm tra wire payload thuần cho cả request (như decodeAgentRequest) và response tại runtime boundary | HTTP server, RequestController, RequestStore, Browser client, mọi type chỉ Host API dùng |
| `presentation/deck/` | Deck state và publication thay đổi hợp lệ thế nào? | Deck lifecycle, Brief và Outline state, generation state và grant, revision và publication invariant, artifact ownership. Có thể giữ private persistence | Request Lifecycle, concrete HTML/PPTX adapter, workflow xuyên domain |
| `presentation/design/` | Design system, template và layout xác định thế nào? | Design contract, design system và template catalog, theme, layout, compatibility rule | Deck lifecycle, generation, native conversion |
| `presentation/document/` | Nội dung slide được biểu diễn và kiểm tra thế nào trước khi gắn với format? | SlideDocument, content node, provenance contract, document validation, FormatAdapter contract | Publication authority, concrete conversion |
| `presentation/html/` | Portable content thành HTML artifact an toàn thế nào? | HTML conversion, giới hạn HTML/CSS, HTML validation | Deck lifecycle, request permission, publication authority |
| `presentation/pptx/` | Portable content thành PPTX artifact thế nào? | PPTX conversion, font mapping, PPTX validation | Deck lifecycle, request permission, publication authority |
| `session/persistence/` | Chat, message, request và approval được lưu và khôi phục thế nào? | Durable record của chat, message, attachment, request, approval. Transaction trong phạm vi Session | Request execution authority, Deck lifecycle, Workspace, trạng thái draft tạm trong bộ nhớ (thuộc apps/web/) |
| `workspace/registry/` | Workspace và folder association được quản lý thế nào? | Workspace record và identity, folder association và folder policy, persistence và recovery của Registry | Chat lifecycle, request execution |
| `tools/filesystem/` | Agent truy cập file trong phạm vi được cấp thế nào? | Path validation, access restriction, bounded read, file identity | User approval, request admission, agent tool policy |

Bốn điểm dễ sai trong các package trên:

- Local Transport và Request Lifecycle cùng nằm trong `host/api/` nhưng là hai trách nhiệm riêng. Transport gọi public operation của Request Lifecycle. Request Lifecycle không import HTTP transport và không dùng HTTP status làm error contract.
- `host/contracts/` chỉ chứa contract an toàn cho cả Browser và Local Host. Không chuyển toàn bộ type của Host API vào package này.
- Request Lifecycle dùng persistence contract của `session/persistence/`. Không component nào sửa Session state qua SQLite implementation.
- `host/contracts/` giữ bản sao độc lập của các wire DTO dùng chung với `session/persistence/`, `presentation/deck/` và `presentation/design/`. Browser import `host/contracts/` và không được phụ thuộc runtime của các domain package đó. `host/api/` giữ kiểm tra tương đương ở mức type lúc compile (`tsc -b`) trong `contract-sync.ts` để chặn lệch contract.

### Tests, scripts và docs

- Test đặt cùng component sở hữu hành vi được kiểm: `apps/web/tests/`, `packages/<group>/<package>/tests/`. Test kiểm hành vi xuyên nhiều component đặt trong `e2e/`. Không bắt buộc chia `unit/`, `integration/`, `contract/`.
- `scripts/` chỉ chứa developer tooling (build, check, repository operation). Không đặt business logic hoặc runtime capability vào `scripts/`.
- Ownership của tài liệu nằm trong [Documentation Conventions](docs.md). File này không thay tài liệu về system architecture, state machine hay database schema trong `docs/architecture/`.

## Dependency rules

### Runtime

| From | Được phụ thuộc | Không được phụ thuộc |
| --- | --- | --- |
| Browser | Browser module, Browser transport, `host/contracts` | Node-only module, Local Host implementation |
| Browser transport | `host/contracts` | RequestController, SQLite, private module của Host |
| Local Host transport | Request Lifecycle, operation dành cho application, type-level reader port của domain package (như DeckReader, OutlineReader) | Browser implementation, runtime class hoặc hàm của domain package |
| Application workflow | Public API của domain và capability, public operation của feature khác | Private persistence implementation |
| Integration | Runtime và protocol contract, capability cần dùng | Browser UI, HTTP error mapping |
| `index.ts` | Concrete implementation cần wiring | — |

### Package và feature

- Workspace khác chỉ import một package qua `package.json` `exports`. Không import `src/`, `lib/` hoặc private subpath của package khác, kể cả bằng relative path. Không dùng TypeScript path alias để vào private internals *(review)*.
- Module trong cùng owner được import implementation của nhau. Public API của một package không tự cho component khác quyền phụ thuộc vào package đó: dependency vẫn theo các rule trong section này *(review)*.
- Package không phụ thuộc application. Domain package không phụ thuộc Browser hoặc Local Host implementation *(review)*.
- `host/contracts/` không phụ thuộc runtime implementation *(review)*.
- `deck/` phụ thuộc FormatAdapter contract, không phụ thuộc `html/` hay `pptx/`. Format adapter chỉ phụ thuộc contract cần thiết của `design/` và `document/` *(review)*.
- Feature chỉ dùng public operation hoặc contract của feature khác. Dependency giữa hai feature chỉ đi một chiều. Feature chỉ công bố public operation khi có consumer bên ngoài feature *(review)*.
- Khi nhiều feature cần một operation, xác định owner của operation trước khi chia sẻ operation đó *(review)*.
- Package graph và feature graph không có vòng. Khi có vòng, sửa ownership. Không tạo module `shared` hay `common` để cắt vòng *(review)*.
- Không re-export toàn bộ private module thành public API *(review)*. Quy tắc về export chỉ để test dùng nằm trong [Testware](testware.md).

Lỗi thuộc component phát hiện ra nó. Cách biểu diễn và chuyển lỗi qua các boundary nằm trong [Coding Guidelines](code.md#error-handling).

## Enforcement

Cột "Chặn bởi" chỉ ghi công cụ đã có trong repo. Cột "Check mục tiêu" là check sẽ thêm trong đợt refactor. Khi check mục tiêu có, chuyển nó sang cột "Chặn bởi".

| Rule | Chặn bởi | Check mục tiêu |
| --- | --- | --- |
| Import package chỉ qua `exports`, không qua private subpath, relative path hoặc alias | `oxlint` (`no-restricted-imports`), `check:boundaries` (`private-package-import`, `tsconfig-private-alias`, `unresolved-internal-import`) | — |
| Browser không import Node-only module | Browser build, `oxlint` (`no-restricted-imports`), `check:boundaries` (`browser-node-import`) | — |
| Feature, Browser feature và integration không lộ private implementation; Browser transport không import Browser UI feature | `check:boundaries` (`feature-private-import`, `browser-feature-private-import`, `browser-transport-ui-import`, `integration-private-import`) | — |
| Package graph, feature graph và Browser feature graph không có vòng | `check:boundaries` (`package-cycle`, `feature-cycle`, `browser-feature-cycle`) | — |
| `host/contracts/` không import runtime implementation | `oxlint` (`no-restricted-imports`), `check:boundaries` (`contracts-runtime-import`) | — |
| Request Lifecycle không import transport | `oxlint` (`no-restricted-imports`), `check:boundaries` (`lifecycle-transport-import`) | — |
| `deck/` không import concrete adapter. Format adapter chỉ import contract của `design/` và `document/` | `check:boundaries` (`deck-concrete-adapter`, `format-adapter-dependency`) | — |
| Package không import application. Domain package không import runtime implementation | `check:boundaries` (`package-app-dependency`, `domain-runtime-dependency`) | — |
| State authority, permission, failure invariant | Behavioral test, review | — |

Ưu tiên TypeScript, `exports` và lint trước khi viết check script riêng. Chỉ viết check script khi công cụ hiện có không kiểm được boundary. Mỗi check kiểm một ownership rule trong file này. Check không chứa bản sao của toàn bộ kiến trúc. Mỗi check phải có negative fixture hoặc test chứng minh check bắt được vi phạm. Build thành công không phải bằng chứng duy nhất cho dependency boundary.

Không sửa dependency boundary bằng alias, re-export hoặc module `shared` chỉ để check pass.
