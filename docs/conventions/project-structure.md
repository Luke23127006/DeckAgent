# Project Structure

Đọc file này để biết cách tổ chức source code của DeckAgent, trách nhiệm của từng folder và các ranh giới phụ thuộc bắt buộc.

## Nguyên tắc

### 1. Strict boundaries, flexible implementation

Mỗi application, package và module phải có trách nhiệm xác định. Component chỉ sở hữu hành vi, state và quyết định thuộc phạm vi của nó.

Mỗi boundary phải trả lời được các câu hỏi sau:

* **Question:** Component trả lời câu hỏi gì?
* **Ownership:** Component sở hữu hành vi, state hoặc contract nào?
* **Exclusions:** Component không được sở hữu trách nhiệm nào?
* **Dependencies:** Component được phép phụ thuộc vào đâu?
* **Extension:** Khi nào thêm code vào component hiện có và khi nào tạo component mới?

Không tạo class, interface, abstraction, layer, package hoặc folder chỉ để tuân theo một template. Không tạo `shared` , `common` , `utils` hoặc `errors` chung để né dependency boundary.

### 2. Runtime ownership

DeckAgent là local application. Browser UI và Local Host là hai execution environments của cùng application.

HTTP/SSE trên localhost là transport nội bộ giữa Browser và Local Host. Transport này không làm DeckAgent trở thành hosted backend application.

* Browser sở hữu UI, browser state và user interactions.
* Local Host sở hữu application workflows, local runtime và quyền truy cập các local capabilities.
* Packages sở hữu domain hoặc capability có responsibility độc lập.
* Composition kết nối các concrete implementations và quản lý application lifecycle.

Không đặt code vào Browser chỉ vì code liên quan đến giao diện. Không đặt code vào Local Host chỉ vì code cần chạy trên Node.js. Xác định owner theo responsibility trước khi xét runtime.

### 3. Ownership và authority

Mỗi state có một authoritative owner. Component khác không được tự thay đổi state nội bộ của owner.

* Domain owner bảo vệ domain invariants và state transitions.
* Persistence owner kiểm soát durable records và transaction thuộc phạm vi của nó.
* Application workflow phối hợp operations của nhiều owner.
* Request Lifecycle sở hữu request execution state, cancellation và terminal status.
* Agent Runtime thực thi agent nhưng không quyết định request terminal status.
* Tool permission authority quyết định capability được cấp cho request.
* Tool executor chỉ thực hiện operation trong phạm vi capability được cấp.
* Local Transport chuyển đổi giao tiếp giữa Browser và Local Host. Transport không sở hữu domain policy.

Khi một operation thay đổi state của nhiều owner, application workflow phải gọi public operations của từng owner. Workflow không được truy cập private storage để sửa state thay owner.

### 4. Public API và private implementation

Mỗi package chỉ công bố những operations và contracts cần cho consumer bên ngoài.

* Package public API được khai báo bằng `package.json` exports.
* Consumer chỉ import public package exports.
* Internal modules có thể import lẫn nhau trong phạm vi owner.
* Feature chỉ công bố public operations khi có consumer bên ngoài feature.
* Feature khác chỉ được sử dụng public operations hoặc contracts đã công bố.
* Không export implementation chỉ để test truy cập.
* Không tạo public API cho một module chưa có nhu cầu sử dụng bên ngoài.

Public API không đồng nghĩa với quyền phụ thuộc tùy ý. Dependency policy vẫn phải xác định component nào được phép sử dụng public API của component khác.

### 5. Quy tắc tạo folder và package

Ưu tiên sử dụng owner hiện có.

Tạo folder mới khi có một responsibility nội bộ cần được phân biệt và có quy tắc ownership, exclusions và dependencies rõ ràng.

Tạo package mới khi component cần public contract và dependency boundary độc lập. Package mới phải có consumer hoặc nhu cầu kiểm soát dependency cụ thể.

Không tạo package chỉ vì:
* File tăng về số lượng.
* Một folder có nhiều file.
* Một feature cần sử dụng code của feature khác.
* Muốn tạo một layer theo Clean Architecture.
* Muốn đặt interface vào một vị trí chung.

Khi hai component cần import lẫn nhau, xem lại ownership và dependency direction trước khi tạo abstraction hoặc package mới.

### 6. Dependency enforcement

Dependency rules phải được kiểm tra bằng công cụ khi có thể.

Ưu tiên sử dụng:
* TypeScript và package exports để bảo vệ public contracts.
* Oxlint hoặc import restrictions để chặn imports không được phép.
* Workspace dependency graph để phát hiện circular package dependencies.
* Browser build để phát hiện Node-only dependencies.
* Behavioral tests để bảo vệ state authority, permission và failure invariants.
* Architecture review cho những quy tắc không thể kiểm tra bằng máy.

Không thay đổi dependency boundary bằng cách thêm alias, re-export hoặc `shared` module chỉ để làm check pass.

## Cấu trúc tham chiếu

Cấu trúc dưới đây mô tả ownership mục tiêu. Không bắt buộc tạo folder rỗng. Chỉ tạo folder khi có code thuộc responsibility tương ứng.

### 1. Applications

```text
apps/
  web/
    src/
      browser/
        features/
        transport/
      features/
      integrations/
        opencode/
      index.ts
    tests/
```

#### `apps/web/`

**Question:** Local web application được tổ chức và vận hành thế nào?

**Owns:**
* Application-specific workflows.
* Browser UI và local communication.
* Integration adapters chỉ phục vụ application.
* Composition và application lifecycle.

**Does not own:**
* Domain invariants đã thuộc package khác.
* Private persistence implementation của package khác.
* Browser-independent capability có public ownership riêng.

#### `apps/web/src/browser/`

**Question:** Người dùng tương tác với DeckAgent qua Browser thế nào?

**Owns:**
* Browser UI.
* UI-local state.
* Navigation và user interactions.
* Browser-specific feature presentation.

**Does not own:**
* Request execution authority.
* Local filesystem access.
* SQLite persistence.
* Agent process execution.

`browser/features/` nhóm UI theo product feature. Không bắt buộc mọi feature phải có folder riêng.

#### `apps/web/src/browser/transport/`

**Question:** Browser giao tiếp với Local Host thế nào?

**Owns:**
* HTTP/SSE clients.
* Request serialization.
* Response decoding.
* Browser-facing error representation.

**Does not own:**
* User permission policy.
* Request Lifecycle.
* Server-side operations.
* Domain state transitions.

Transport sử dụng cross-runtime contracts. Browser không import Local Host implementation.

#### `apps/web/src/features/`

**Question:** Local application phối hợp các capabilities thế nào để hoàn thành một use case?

**Owns:**
* Application workflows.
* Coordination giữa các domain và capability owners.
* Application-level failure policy.
* Cross-owner operations.

**Does not own:**
* Domain invariants của package khác.
* Concrete HTTP request/response handling.
* Browser DOM và UI state.
* External protocol implementation.

Feature có thể sử dụng public operations của feature khác khi dependency được cho phép. Feature không được import private implementation của feature khác.

Không bắt buộc mỗi feature có `service.ts` , `controller.ts` hoặc `repository.ts` .

#### `apps/web/src/integrations/`

**Question:** Local application giao tiếp với external runtime hoặc service thế nào?

**Owns:**
* Concrete protocol adapters.
* Process lifecycle và protocol conversion.
* External service clients thuộc application.

**Does not own:**
* Application admission policy.
* Domain invariants.
* Request terminal-state authority.
* User permission authority.

`integrations/opencode/` sở hữu OpenCode-specific execution, process và protocol handling.

Integration không được quyết định một user request có hợp lệ theo product policy hay không.

#### `apps/web/src/index.ts`

**Question:** Local application được khởi tạo và đóng thế nào?

**Owns:**
* Startup và shutdown.
* Concrete dependency wiring.
* Application configuration.
* Registration của các capabilities và adapters.

**Does not own:**
* Domain operations.
* Feature-specific business rules.
* Private implementation của package khác.

Không tạo folder `composition/` nếu entry point và các module hiện có đã đủ thể hiện trách nhiệm này.

### 2. Packages

```text
packages/
  host/
    api/
    contracts/

  presentation/
    deck/
    design/
    document/
    html/
    pptx/

  session/
    persistence/

  workspace/
    registry/

  tools/
    filesystem/
```

#### `packages/host/api/`

**Question:** Local Host nhận command và quản lý local request execution thế nào?

**Owns:**
* Local HTTP/SSE transport.
* Authentication và request validation tại transport boundary.
* Request Lifecycle.
* Request event delivery và approval coordination.

**Does not own:**
* Browser UI.
* Domain invariants của Deck.
* OpenCode-specific process implementation.
* Concrete SQLite implementation của Session Persistence.

Local Transport và Request Lifecycle là hai logical responsibilities. Có thể đặt trong cùng package nhưng phải có dependency direction riêng.

Transport được gọi public operations của Request Lifecycle. Request Lifecycle không được import HTTP transport implementation hoặc sử dụng HTTP semantics làm error contract nội bộ.

#### `packages/host/contracts/`

**Question:** Browser và Local Host trao đổi dữ liệu theo contract nào?

**Owns:**
* Cross-runtime wire DTOs.
* Request và response representations.
* Event envelopes.
* Public protocol error payloads.
* Validators cần thiết cho dữ liệu đi qua runtime boundary.

**Does not own:**
* HTTP server.
* RequestController.
* RequestStore implementation.
* Browser clients.
* Domain persistence.
* Runtime implementation.

Package chỉ chứa contracts an toàn cho Browser và Local Host cùng sử dụng. Không chuyển toàn bộ types của Host API vào package này.

Tên package và public exports phải phản ánh đúng phạm vi cross-runtime communication.

#### `packages/presentation/deck/`

**Question:** Deck state và publication được thay đổi hợp lệ thế nào?

**Owns:**
* Deck lifecycle.
* Brief và Outline state.
* Generation state và grants.
* Revision và publication invariants.
* Deck metadata và artifact ownership.

**Does not own:**
* Browser UI.
* Request Lifecycle.
* Concrete HTML/PPTX implementations.
* Application workflow xuyên nhiều domain.

Deck có thể giữ private persistence implementation để bảo vệ transaction và domain invariants. Không bắt buộc tạo Repository layer.

Deck phụ thuộc vào format contract, không phụ thuộc concrete native format adapter.

#### `packages/presentation/design/`

**Question:** Design system, template và layout được xác định thế nào?

**Owns:**
* Design contracts.
* Design system và template catalog.
* Theme và layout definitions.
* Design compatibility rules.

**Does not own:**
* Deck lifecycle.
* Generation execution.
* Native artifact conversion.

#### `packages/presentation/document/`

**Question:** Nội dung slide được biểu diễn và kiểm tra thế nào khi chưa gắn với native format?

**Owns:**
* Portable SlideDocument representation.
* Content nodes và provenance contracts.
* Document validation.
* FormatAdapter contract.

**Does not own:**
* Deck publication authority.
* SQLite persistence.
* Concrete HTML/PPTX conversion.

#### `packages/presentation/html/`

**Question:** Portable content được chuyển thành HTML artifact an toàn và hợp lệ thế nào?

**Owns:**
* HTML conversion.
* HTML/CSS capability restrictions.
* HTML-specific validation.
* HTML artifact construction.

**Does not own:**
* Deck lifecycle.
* Request permissions.
* Publication authority.

#### `packages/presentation/pptx/`

**Question:** Portable content được chuyển thành PPTX artifact thế nào?

**Owns:**
* PPTX conversion.
* Font mapping.
* PPTX-specific validation.
* Native artifact construction.

**Does not own:**
* Deck lifecycle.
* Request permissions.
* Publication authority.

#### `packages/session/persistence/`

**Question:** Chat, message, request và approval records được lưu và khôi phục thế nào?

**Owns:**
* Session persistence.
* Durable request records.
* Message và attachment records.
* Approval records.
* Transaction và consistency trong phạm vi Session.

**Does not own:**
* Request execution authority.
* Application workflows.
* Deck lifecycle.
* Workspace ownership.

Request Lifecycle sử dụng persistence contract. Application không truy cập private SQLite implementation để thay đổi Session state.

#### `packages/workspace/registry/`

**Question:** Workspace identity và folder association được quản lý thế nào?

**Owns:**
* Workspace records.
* Workspace identity.
* Folder association và folder policy.
* Workspace persistence và recovery trong phạm vi Registry.

**Does not own:**
* Chat lifecycle.
* Request execution.
* Application workflow xuyên Workspace và Session.

#### `packages/tools/filesystem/`

**Question:** Filesystem resources được truy cập an toàn trong phạm vi được cấp thế nào?

**Owns:**
* Path validation.
* Filesystem access restrictions.
* Bounded read operations.
* File identity và access validation.

**Does not own:**
* User approval authority.
* Request admission.
* Agent tool policy.
* Application workflow.

### 3. Tests và Developer Tooling

#### Tests

Test thuộc component sở hữu behavior được kiểm tra.

```text
apps/web/tests/
packages/<group>/<package>/tests/
e2e/
```

* Application tests thuộc application.
* Package tests thuộc package tương ứng.
* E2E tests thuộc workspace kiểm tra behavior xuyên nhiều component.

Không bắt buộc mọi package phải có `unit/` , `integration/` và `contract/` .

Vị trí test và dependency boundary của test thuộc file này. Cách viết và thực thi test thuộc [Testware](testware.md).

#### `scripts/`

**Question:** Developer thực hiện build, check và repository operations thế nào?

Scripts chỉ chứa developer tooling. Không đặt production business logic hoặc runtime capabilities vào đây.

Boundary checks phải kiểm tra đúng ownership rules. Check không được trở thành nơi chứa một bản sao của toàn bộ kiến trúc.

#### `docs/`

Documentation có ownership theo [Documentation Conventions](docs.md), [Architecture Documentation](architecture.md) và các convention tương ứng.

`project-structure.md` quy định vị trí source code. File này không thay thế tài liệu mô tả system architecture, state machines hoặc database schema.

## Dependency rules

### 1. Runtime boundaries

| From | Allowed | Forbidden |
|---|---|---|
| Browser | Browser modules, Browser transport, cross-runtime contracts | Node-only modules, Local Host implementation |
| Browser transport | Cross-runtime contracts | RequestController, SQLite, private Host modules |
| Local Host transport | Request Lifecycle và application-facing operations | Browser implementation |
| Application workflows | Public domain/capability APIs và allowed feature operations | Private persistence implementation |
| Integrations | Runtime/protocol contracts và required capabilities | Browser UI, HTTP error mapping |
| Composition | Concrete implementations cần wiring | Không sở hữu domain invariants |

### 2. Feature boundaries

* Feature có thể sử dụng public operations hoặc contracts của feature khác.
* Feature không được import private implementation của feature khác.
* Feature chỉ phụ thuộc vào feature được phép trong dependency policy.
* Cross-feature dependencies không được tạo circular dependencies.
* Khi nhiều feature cần một operation, xác định owner của operation trước khi chia sẻ.
* Application workflow phối hợp nhiều owner. Workflow không được thay đổi private state của owner.

Không tạo `shared` hoặc `common` module để giải quyết circular dependencies.

### 3. Package boundaries

* Workspace khác chỉ import package qua public exports.
* Không import trực tiếp `src/`,  `lib/` hoặc private subpaths của package khác.
* Package không được phụ thuộc vào application.
* Domain package không được phụ thuộc vào Browser hoặc Local Host implementation.
* Format adapters chỉ phụ thuộc vào contracts cần thiết của Design và Document.
* Deck không phụ thuộc concrete HTML/PPTX adapters.
* Cross-runtime contracts không phụ thuộc runtime implementations.
* Package dependency graph không được có circular dependencies.

Package mới phải có responsibility, consumer và dependency boundary có thể giải thích.

### 4. Public API và private implementation

* `package.json exports` xác định package public entry points.
* Feature public entry points chỉ được tạo khi có consumer bên ngoài feature.
* Internal modules được phép sử dụng implementation details trong phạm vi owner.
* Không export implementation chỉ để test truy cập.
* Không re-export toàn bộ private modules thành public API.
* Không dùng TypeScript path aliases để truy cập private package internals.

### 5. Error và failure boundaries

* Component phát hiện lỗi sở hữu error definition tương ứng.
* Domain error không phụ thuộc HTTP status code.
* Request Lifecycle sở hữu request terminal-state policy.
* Application workflow sở hữu failure policy của operation xuyên nhiều owner.
* Local Transport chuyển lỗi nội bộ thành wire error payload.
* Browser chịu trách nhiệm trình bày lỗi cho người dùng.

Không tạo một Error Service chung để sở hữu mọi lỗi.

Chi tiết về error representation và error handling thuộc [Coding Guidelines](code.md).

### 6. Enforcement

| Rule | Enforcement |
|---|---|
| Package public API | `package.json exports` |
| Package dependency cycle | Workspace dependency graph check |
| Private package imports | Import boundary check |
| Browser imports Node-only modules | Browser build và import check |
| Cross-feature private imports | Import boundary check |
| Circular feature dependencies | Import graph check |
| Contract package imports runtime implementation | Import restriction |
| Request Lifecycle imports transport | Internal import restriction |
| Domain imports concrete adapters | Package dependency check |
| State và permission invariants | Behavioral tests |

Ưu tiên dùng TypeScript, package exports và lint trước khi tạo check script riêng.

Check script chỉ được bổ sung khi các công cụ hiện có không kiểm tra được boundary cần bảo vệ.

Mỗi check phải phát hiện được vi phạm bằng negative fixture hoặc test phù hợp. Không coi việc build thành công là bằng chứng duy nhất rằng dependency boundaries hợp lệ.
