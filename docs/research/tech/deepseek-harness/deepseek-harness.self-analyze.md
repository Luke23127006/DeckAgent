# Self-analyze DeepSeek

Author: BuhDuy - Team PO

## [DeepSeek Harness, Được Giải Thích: Runtime Tác Tử Đằng Sau 'Model + Harness = Agent'](https://www.orcarouter.ai/vi/blog/deepseek-harness-explained)

### Các luận điểm chính được viết

1. DeepSeek Harness connect "Model" + "Hệ thống tệp của bạn, terminal của bạn, web và các tác nhân khác".
2. Được xây dựng trên một **khung plugin là Cordis?**.
3. Harness = Khung kết nối Model vào Real World.

   - Model chỉ có thể tạo text (instructions).
   - Harness giúp Model read/ write folder, chạy lệnh shell, tìm kiếm web, duy trì kế hoạch, gọi công cụ, phản ứng với lỗi và đánh giá khi nào tác vụ hoàn thành.

4. Kiến trúc Cordis:

   4.1. Triết lý thiết kế: **Everything-as-Plugins?** được ghi trong [README.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/README.md)

   4.2. Vòng lặp tác tử (Agent Loop), bộ chuyển đổi Models, skills, session history, sandbox và cả giao diện Web đều là các plugin của Cordis.

   4.3. Các plugins cung cấp thêm abilities, **các preset?** quyết định khả năng nào mà một agent nhất định có thể thấy.

   4.4. Monorepo chứa 55 **gói packages/ (ko hiểu mối quan hệ giữa package và plugins là gì?)** - core, llm, mcp, sandbox, plan, goal, workspace, ...

   4.5 **dsh-plugin?**

   4.6. DSH có 4 **preset agent (đoán là nó giống các agent model)**, mỗi preset = một set các plugin khác nhau. Menu của DeepSeek Harness supports 4 preset khác nhau:

      4.6.1. **Standard - Một tác nhân lập trình hoàn chỉnh**: chỉnh sửa tệp, shell, tìm kiếm tệp và web, kỹ năng, lập kế hoạch, mục tiêu, subagent và quy trình làm việc. Lựa chọn mặc định phù hợp cho hầu hết công việc.

      4.6.2. **Code — được gọi là PTC, "programmatic tool calling," Standard Preset + Code Mode SDK** (cho phép mô hình viết các chương trình TypeScript để kết hợp các lời gọi công cụ đa bước trong một chương trình).

      4.6.3. **Tối giản — chỉ gồm phiên bash bền vững và str_replace_editor?**. Được xây dựng để tái hiện các lần chạy benchmark; đây là bộ cấu hình mà Deep​Seek đã dùng để đạt được con số 82.7 trên Terminal-Bench V4 Flash. Tối giản không phải là vô hại — quyền truy cập shell vẫn là quyền truy cập shell.

      4.6.4. **Creator — thư mục preset thứ tư theo đúng nghĩa đen có tên là cordis — Standard cùng với kiểm tra runtime, thử nghiệm plugin Cordis trong bộ nhớ và soạn thảo preset**. Tác nhân có thể cài đặt, thay thế hoặc phá hủy plugin ngay giữa cuộc trò chuyện. Một môi trường kỹ thuật, không phải lớp phê duyệt sản xuất.

> ***Tự nhận định: Nên tiếp cận DeckAgent theo tư duy xây dựng một preset như trong DeepSeek Harness***.

5. Trajactory = DevTools for Agent

   5.1. Nó là session log cho mọi prompt hệ thống, quá trình lý luận, lời gọi công cụ và kết quả, lập lịch subagent, tiêm ngữ cảnh.

   5.2. Chế độ xem Trajectory hỗ trợ **kiểm tra theo nguồn, tiếp tục, fork, tìm kiếm và phát lại?**. Fork chính là điểm nhấn: bạn có thể thay đổi một chỉ dẫn và phát lại lần chạy song song với bản gốc thay vì vứt bỏ dấu vết.

   5.4. DSH có thể **tạo ra các agent khác làm subagent — bao gồm, theo tài liệu capability-seams, một nhà cung cấp Codex và một nhà cung cấp Claude Code.**

   5.5. 5 interfaces: Web UI, Desktop App, **các lượt chạy headless một lần?**, **một SDK Python điều khiển DSH qua JSON-RPC Studio?**, và --dump-condfig, lệnh in cây plugin đã được tập hợp.

> **Điều gì đáng để nghiên cứu trong deepseek:**
> **1. Khung Cordis (bộ plugins chứa Agent Loop, bộ chuyển đổi Models, SKILLs, Session History, Sandbox, giao diện Web) => Mình sẽ lấy cái khung chung trừ các plugins để harness hoạt động, còn lại vụ prompt và hiển thị presentation sẽ nghiên cứu lắp vào.**
> **2. Mỗi quan hệ giữa packages/ và Plugins.**
> **3. Mình đang có giả thuyết là thiết kế Harness cho DecKAgent = Dùng lại bộ khung Cordis + Thiết kế Preset cho Presentation Generation của DeckAgent.**
> **4. Nghiên cứu xem có thể dùng idea của Trajactory để mà apply vào DeckAgent không? Tuy chưa rõ Use Cases của nó.**

## deepseek-harness/docs/cordis-tutorial/

> Phần này cũng record lại thêm các syntax về framework và language học được khi nghiên cứu codebase nên sẽ lẫn vào trong thông tin chính về cơ chế của DeepSeek Harness Codebase.

### index.md

1. TypeScript có Type (đầy đủ là Type Annotation) thì **khi mà build + run TS thì tới runtime code được run là JS Code (bên execute là Node.js/ Browser)**

2. **import** trong JS là = sử dụng giá module sử dụng **giá trị mà module khác export.**

3. Trong file này có ý:

   > **`import type { Context } from '@deepseek-ai/cordis'`** imports only type information. It vanishes at runtime, so a plugin file that needs `Context` solely for annotations adds no runtime dependency.

   => Nghĩa là đang nói đến bản chất của TS.

4. Trong TS có một cơ chế gọi là **Declaration Merging**. Khi ta muốn thêm một thuộc tính vào trong một interface, ta có thể declare lại interface đó lại lần nữa mà thuộc tính mới sẽ được merge vào. Ví dụ

   ```ts
   interface User {
       name: string;
   }

   interfec User {
       age: number;
   }
   ```

   khi runtime thì interface được JS kết hợp lại thành

   ```ts
   inrterface User {
       name: string;
       age: number;
   }
   ```

5. Trong file có ý này

   > **Declaration merging** (`declare module '@deepseek-ai/cordis' { ... }`) adds your entries to interfaces that Cordis already declares — for example the type of a new `ctx.greeter` property or event name. It generates no runtime wiring; the plugin separately provides the service or emits the event. Chapter 3 shows the pattern in full.

   => Nghĩa là khi tạo PresentationPlugin cung cấp Presentation Service tạo Slides cho DeckAgent. Ta có thể tạo Service TS Interface trước và sau đó sẽ add nó vào context thông qua Declaration Merging, sau đó trong plugin sẽ dùng Service mới được có trong Context.

   ```ts
   interface PresentationService {
       createSlide(title: string): void;
   }

   ...

   declare module `deepseek-ai/cordis` {
       interface Context {
           presentation: PresentationService;
       }
   }

   ...

   import type { Context } from `deepseek-ai/coris`

   function apply(ctx: Context): void {
       ctx.presentation.createSlides("Introduction");
   }
   ```

6. Tại sao plugin code lại được viết theo cách này?

   6.1. Cordis được thiết kế theo kiến trúc plugin và 1 plugin **sẽ có thể có nhu cầu cung cấp Service của nó cho 1 plugin khác**

   6.2. Ta thường sẽ nghĩ tới việc import trực tiếp Service của Plugin để sử dụng nhưng tạo ra việc Plugin A phụ thuộc plugin B, thay vào đó là **nạp Service vào Context (Có vẻ giống Dependency Injection nhưng không phải)**.

   => Thay vì

   ```ts
   import { createSlide } from './presentation';

   createSlide("Introduction");
   ```

   thì

   ```ts
   function apply(ctx: Context) {
     ctx.presentation.createSlide("Introduction");
   }
   ```

7. Dependency Injection là gì? Giải quyết bài toán gì?

   7.1. **DI = Một thành phần không tự quyết định cách tạo ra những thứ nó cần để hoạt động. Thay vào đó, nó nhận những thứ đó từ bên ngoài.**

   7.2. **Vấn đề: Khi hệ thống lớn, một dependency có thể có nhiều cách triển khai, ví dụ Repository có JdbcRepository và JpaRepository; nếu Service tự khởi tạo dependency bằng new, nó sẽ bị gắn chặt với một implementation cụ thể, khiến việc thay thế implementation, chia sẻ instance hoặc kiểm thử trở nên khó khăn.**

   Thay vì:

   ```java
   class UserService {
       private UserRepository repository = new JdbcRepository();
   }
   ```

   thì:

   ```java
   class UserService {
       private final UserRepository repository;

       UserService(UserRepository repository) {
           this.repository = repository;
       }
   }
   ```

> **Nhận định lại: Trong ví dụ Cordis, plugin nhận Context từ bên ngoài, nhưng sau đó tự tìm service thông qua ctx.presentation. Vì vậy, nó gần với Service Locator hơn là Dependency Injection trực tiếp.**

### 01-first-plugin.md

1. Cấu trúc chung của một Plugin file là **luôn export một apply(ctx: Context) function.**

   ```ts
   import type { Context } from `deepseek-ai/cordis`;

   export const name = 'hello';

   export apply(ctx: Context): void {
       console.log(name);
   } 
   ```

2. Các Plugin sẽ được declared bên trong cordis.yml.

3. Trong file có một đoạn code:

   ```ts
   import { Service, type Context } from '@deepseek-ai/cordis'

   // 1. Function plugin (what you just wrote).
   export function apply(ctx: Context) {}

   // 2. Object plugin: an object with an `apply` method.
   export const objectPlugin = {
     name: 'object-plugin',
     apply(ctx: Context) {},
   }

   // 3. Class plugin: a Service subclass (covered in chapter 3).
   export class MyService extends Service {
     constructor(ctx: Context) {
       super(ctx, 'myTutorialService')
     }
   }
   ```

   thì **nó khác gì vụ dùng add Service vào bên trong Context và dùng Service đó trong Plugin (Plugin khác) thông qua Context?**

   => Cần phân biệt chính xác thành 3 vấn đề:

   1. Plugin Shape: Cách định nghĩa một plugin để Cordis có thể load và chạy nó. Có ba dạng: Function, Object và Class.
   2. Service Registration: Cách một plugin tạo và đăng ký service để các plugin khác có thể sử dụng. Ví dụ: `class PresentationService extends Service`.
   3. Service Consumption: Cách một plugin khác sử dụng service đã được đăng ký. Ví dụ: `ctx.presentation.createSlide()`.

   Còn Declaration Merging là cơ chế TypeScript bổ sung type cho `ctx.presentation`, không phải cơ chế đăng ký hay sử dụng service tại runtime.

   Ví dụ, trong DeckAgent:

   ```ts
   // 1. Định nghĩa và cung cấp service
   class PresentationService extends Service {
     constructor(ctx: Context) {
       super(ctx, 'presentation');
     }

     createSlide(title: string) {
       console.log(title);
     }
   }
   ```

   ```ts
   // 2. Khai báo type để TypeScript hiểu Context
   declare module '@deepseek-ai/cordis' {
     interface Context {
       presentation: PresentationService;
     }
   }
   ```

   ```ts
   // 3. Plugin khác sử dụng service
   function apply(ctx: Context) {
     ctx.presentation.createSlide("Introduction");
   }
   ```

   Chốt lại: Ba Plugin Shapes trả lời câu hỏi "Viết plugin dưới hình thức nào?". Còn Service Registration và Service Consumption trả lời "Plugin cung cấp và sử dụng chức năng của nhau như thế nào?".

   Chúng liên quan với nhau nhưng là những vấn đề thiết kế khác nhau.

4. **Có nhất thiết phải dùng Object Plugin?**

   Object Plugin tồn tại để đóng gói hàm apply() cùng với metadata và các thuộc tính khác trong một object, thay vì chỉ export một function.

   Tuy nhiên, Object Plugin không cung cấp thêm khả năng đặc biệt chỉ vì nó là object.

   - So sánh Function Plugin và Object Plugin:

     Function Plugin:

     ```ts
     export const name = 'hello';

     export function apply(ctx: Context) {
       console.log("Hello");
     }
     ```

     Object Plugin:

     ```ts
     export const helloPlugin = {
       name: 'hello',

       apply(ctx: Context) {
         console.log("Hello");
       }
     };
     ```

     Cả hai đều chứa tên plugin và logic thực thi.

     Điểm khác biệt:

     - Function Plugin: name và apply là các export riêng của module.
     - Object Plugin: name và apply là các thuộc tính của cùng một object.

   - Tại sao Object Plugin hữu ích?

     Giả sử bạn muốn tạo nhiều plugin trong cùng một module:

     ```ts
     export const loggingPlugin = {
       name: 'logging',
       apply(ctx: Context) {
         console.log("Logging initialized");
       }
     };

     export const analyticsPlugin = {
       name: 'analytics',
       apply(ctx: Context) {
         console.log("Analytics initialized");
       }
     };
     ```

     Mỗi object đại diện cho một plugin riêng biệt.

     Bạn có thể truyền từng object cho một API đăng ký plugin, nếu API đó chấp nhận Object Plugin.

     Trong khi đó, nếu sử dụng cấu trúc module export apply như tutorial đầu tiên, mỗi module chỉ có một named export apply với tên đó.

     Đây là lợi ích về cách tổ chức code, không có nghĩa loader YAML trong tutorial tự động nhận hai object trên.

   - Có bắt buộc sử dụng Object Plugin không?

     Không.

     Trong tutorial bạn gửi, DeepSeek chỉ xác nhận Cordis chấp nhận ba plugin shapes và Function Plugin là dạng phổ biến nhất.

     Tài liệu chưa đưa ra Use Case nào bắt buộc phải sử dụng Object Plugin.

   - Tư duy cần nhớ:

     - Function Plugin: Phù hợp khi chỉ cần định nghĩa hành vi của plugin.
     - Object Plugin: Phù hợp khi muốn đóng gói hành vi và metadata trong một object.
     - Class Plugin: Phù hợp khi muốn triển khai service theo cơ chế Service của Cordis.

     Vì vậy, ở giai đoạn này, bạn chưa cần chọn Object Plugin cho DeckAgent. Hãy sử dụng Function Plugin trước, đúng như khuyến nghị của tutorial.

### 03-service.md

1. 1 Service = 1 capability mà Plugin có thể thực hiện + Plugin khác sử dụng thông qua ctx: Context.
2. Trong đoạn code đưa ra: 
   2.1. Tại sao đã add Service vào context rồi lại phải ctx.plugin(Service) để gọi là gắn class plugin vào Cordis (chưa hiểu vấn đề lắm)?
   
      Thoạt nhìn thì có vẻ như Cordis đang đăng ký cùng một Service hai lần. Nhưng thực tế, hai đoạn code đang làm hai việc hoàn toàn khác nhau.

      Điểm quan trọng là phân biệt TypeScript biết một Service tồn tại và Cordis thực sự tạo, đăng ký Service đó tại runtime.

      Xét ba đoạn code:

      - Đoạn A — Declaration Merging

        ```ts
        declare module '@deepseek-ai/cordis' {
          interface Context {
            greeter: GreeterService
          }
        }
        ```

        Đoạn này chỉ thông báo cho TypeScript rằng: "Object có type `Context` sẽ có một thuộc tính `greeter`, thuộc type `GreeterService`."

        Nó không thực hiện bất kỳ thao tác nào tại runtime.

        Nói cách khác, mình chưa thực sự thêm Service vào Context. Mình mới chỉ thêm thông tin về Service vào định nghĩa type của Context.

      - Đoạn B — Định nghĩa Service

        ```ts
        export class GreeterService extends Service {
          constructor(ctx: Context) {
            super(ctx, 'greeter')
          }

          greet(who: string) {
            return `Hello, ${who}!`
          }
        }
        ```

        Đoạn này định nghĩa cách `GreeterService` hoạt động.

        Nhưng định nghĩa một class không đồng nghĩa với việc tạo instance của class đó.

        Ví dụ Java:

        ```java
        class UserService {
            void greet() {
                System.out.println("Hello");
            }
        }
        ```

        Chỉ viết class này không làm chương trình tự tạo `UserService`.

        Tương tự, `GreeterService` mới chỉ là một class mà Cordis có thể khởi tạo.

      - Đoạn C — Gắn Plugin vào Cordis

        ```ts
        export function apply(ctx: Context) {
          ctx.plugin(GreeterService)
        }
        ```

        Đây mới là thao tác yêu cầu Cordis gắn `GreeterService` vào hệ thống.

        Theo tutorial, `GreeterService` kế thừa `Service`, nên bản thân nó cũng là một Class Plugin.

        Khi Cordis khởi tạo Service Class, constructor gọi:

        ```ts
        super(ctx, 'greeter')
        ```

        Đây là nơi service instance được đăng ký với tên `greeter`.

      - Có thể hình dung như sau:

        - Declaration Merging: TypeScript biết `ctx.greeter` có type gì.
        - Class Definition: Định nghĩa `GreeterService` và phương thức `greet()`.
        - `ctx.plugin(GreeterService)`: Yêu cầu Cordis gắn Class Plugin.
        - `super(ctx, 'greeter')`: Đăng ký service instance vào Cordis.

        Sơ đồ trên phân biệt các vai trò. Declaration Merging diễn ra ở compile time, không phải bước runtime.

      - Vậy có hai thao tác runtime khác nhau:

        - `ctx.plugin(GreeterService)` — Gắn plugin.
        - `super(ctx, 'greeter')` — Đăng ký service khi instance được khởi tạo.

   2.2. Và tại sao việc khai báo 'export const inject = ['greeter'] lại xử lí vụ biết được greeter đã được chạy lúc runtime hay chưa?

      Đây là câu hỏi quan trọng hơn, vì nó liên quan đến cơ chế của Plugin Framework.

      Trước tiên, `inject` không tự kiểm tra bất kỳ thứ gì.

      ```ts
      export const inject = ['greeter']
      ```

      Đây chỉ là một khai báo dữ liệu.

      Bản thân JavaScript không có cơ chế đặc biệt nào cho biến tên `inject`.

      Cordis mới là thành phần đọc khai báo đó và sử dụng nó để quyết định khi nào chạy plugin.

      2.2.1. Cơ chế hoạt động
      
      Giả sử có hai plugins: `greeter.ts` — Provider Plugin, và `consumer.ts` — Consumer Plugin.

      Trong `consumer.ts`:

      ```ts
      export const inject = ['greeter']

      export function apply(ctx: Context) {
        console.log(ctx.greeter.greet('world'))
      }
      ```

      Khi loader nạp Consumer Plugin, Cordis đọc metadata `inject`.

      Theo tutorial, nếu service `greeter` chưa tồn tại, Cordis giữ Consumer Plugin ở trạng thái `PENDING` và chưa gọi `apply()`.

      Minh họa dependency check:

      - Cordis nạp Consumer Plugin → Đọc `inject = ['greeter']`
      - Service `greeter` đã tồn tại?
        - Chưa → `PENDING`, chờ service xuất hiện.
        - Rồi → Gọi `apply(ctx)`, Consumer bắt đầu hoạt động.

      2.2.2. Nhưng Cordis biết service tồn tại bằng cách nào?
      
      Hãy liên hệ lại:

      ```ts
      super(ctx, 'greeter')
      ```

      Theo tutorial, lời gọi này đăng ký service instance dưới tên `greeter`.

      Vì vậy, Cordis có thông tin về các services đã được đăng ký.

      Khi Consumer Plugin khai báo `export const inject = ['greeter']`, Cordis có thể đối chiếu dependency đó với service đã đăng ký.

      2.2.3. Điểm cần phân biệt

      - `inject` không kiểm tra `GreeterService` đã thực hiện xong mọi công việc hay chưa.
      - Nó yêu cầu service tên `greeter` phải tồn tại trước khi `apply()` của Consumer chạy.
      - Khi provider bị unload, Cordis cũng unload các consumer phụ thuộc vào service đó. Khi service trở lại, các consumer được load lại.

      Lưu ý: Tutorial xác nhận hành vi này, nhưng không mô tả chính xác cấu trúc dữ liệu nội bộ hoặc thuật toán mà Cordis sử dụng để theo dõi dependencies. Muốn biết chi tiết đó, mình cần đọc source code.

      2.2.4. Tư duy thiết kế đằng sau hai cơ chế
      
      Bây giờ có thể thấy Cordis đang giải quyết hai bài toán riêng:

      - Service Registration: Làm sao framework biết service nào đang được cung cấp và có thể truy cập?
      - Dependency Lifecycle: Làm sao framework chỉ chạy một plugin khi những services bắt buộc đã tồn tại, đồng thời phản ứng khi chúng biến mất?

      Đây là lý do Cordis không chỉ sử dụng Context như một Service Locator đơn giản.

      Nó còn quản lý mối quan hệ giữa các plugins trong suốt runtime.

      => Chốt lại: `declare module` giúp TypeScript hiểu Service; `ctx.plugin()` gắn plugin; `super(ctx, 'greeter')` đăng ký service instance; còn `inject` khai báo dependency để Cordis quyết định khi nào Consumer Plugin được chạy.

### 04-events.md

1. Events = Announce Something + Without Knowing Which Plugins Listen
2. Nó cũng na ná Service nhưng mà Syntax khác + Feature khác (cần Listener, cái này thì cái Events nào cũng được thiết kế vậy).

### 05-config.md

1. Plugin Configuration = Config Declaration + Runtime Validation + Config Injection
- Config Declaration: Plugin định nghĩa các trường cấu hình và kiểu dữ liệu hợp lệ.
- Runtime Validation: Cordis kiểm tra giá trị cấu hình theo schema trước khi chạy plugin.
- Config Injection: Cordis truyền cấu hình đã được kiểm tra vào apply(ctx, config).

2. Khi chạy:
- Loader đọc cấu hình trong cordis.yml.
- Runtime schema Config kiểm tra dữ liệu.
- greeting không được khai báo trong YAML nên nhận giá trị mặc định "Hello".
- Cordis gọi apply(ctx, config) với cấu hình đã được kiểm tra.

3. Cordis Configuration cho phép hai khả năng chính:
- Volatile Config — Thay đổi config tại runtime: Khi Harness đang chạy, bạn có thể sửa cordis.yml. Nếu Loader phát hiện thay đổi và trường đó được khai báo .volatile(), giá trị mới sẽ được áp dụng mà không cần restart plugin.
- Computed Config — Dùng cùng một file config cho nhiều máy: Bạn có thể sử dụng một cordis.yml chung, nhưng mỗi máy nhận giá trị khác nhau dựa trên biến môi trường.

### 06-composition-and-hmr.md

1. Chapter này tập trung vào ba vấn đề:
- Plugin Composition: Cách tổ chức, bật/tắt và thay thế plugins trong cordis.yml. Nhưng cần phân biệt hai tình huống:
  - Provider chưa từng được load: Consumer thiếu required service nên ở trạng thái PENDING. Cordis chưa gọi apply() của Consumer.
  - Provider đang chạy rồi bị disable: Cordis unload Provider và các Consumer phụ thuộc vào service đó. Consumer phải chờ service xuất hiện trở lại. 

2.  Hot Module Replacement (HMR): Cách cập nhật code của plugin khi ứng dụng đang chạy. => Nghĩa là phần đó cho tôi các plugin supports việc update code của plugin khác khi đang chạy như @deepseek-ai/cordis-plugin-logger-console; @deepseek-ai/cordis-plugin-timer hay '@deepseek-ai/dsh-hmr

3. Plugin Diagnostics: Cách kiểm tra vì sao một plugin không được khởi chạy. => Plugin Diagnostics trong Chapter 6 là ví dụ về cách viết **một plugin (mới) để kiểm tra và log trạng thái của các plugins khác**, nhằm tìm nguyên nhân chúng không chạy.

### 07-into-the-harness.md

Chapter 7 — Into the Harness là bước chuyển từ Cordis Plugin Framework sang DeepSeek Agent Harness.

Các Chapter 1–6 giải thích cách tạo plugin, đăng ký service, khai báo dependency, sử dụng events và quản lý lifecycle. Chapter 7 không giới thiệu một cơ chế plugin hoàn toàn mới; nó chỉ ra cách sử dụng những cơ chế đã học để mở rộng khả năng thực tế của AI Agent.

1. **Những gì mới so với Chapter 1–6.**

   | Cơ chế | Mới hay đã biết? | Ý nghĩa |
   | --- | --- | --- |
   | `inject = ['tools']` | Đã biết | Chờ Tools Service sẵn sàng. |
   | `ctx.tools` | Áp dụng mới | Truy cập Tools Service có sẵn của Harness. |
   | `defineTool()` | Mới | Định nghĩa một tool mà AI model có thể gọi. |
   | `ctx.tools.register()` | Mới | Đăng ký tool vào Tool Registry. |
   | `ctx.tools.execute()` | Mới | Thực thi tool qua Harness Tool Pipeline. |
   | `output.schema` | Mới | Khai báo kiểu dữ liệu kết quả chính của tool. |
   | `output.render` | Mới | Chuyển kết quả thành nội dung trả về của tool. |
   | `tools/result` | Áp dụng mới | Event thông báo kết quả thực thi tool. |
   | `ToolCallId` | Mới | Type định danh tool call để liên kết lời gọi với kết quả. |

2. **Điểm mới quan trọng nhất: Tool không phải Service.**

   Trước đây, một plugin gọi trực tiếp Service của plugin khác:

   ```ts
   ctx.greeter.greet('Cordis')
   ```

   Chapter 7 giới thiệu cách định nghĩa tool thông qua Tool Registry:

   ```ts
   ctx.tools.register(defineTool({
     name: 'greet',
     description: 'Greet the named person.',
     parameters: {
       name: {
         type: 'string',
         required: true
       }
     },
     output: {
       schema: { type: 'string' },
       render: (_args, value) => [
         { type: 'text', text: value }
       ]
     },
     async execute(args) {
       return `Hello, ${args.name}!`
     }
   }))
   ```

   Điểm khác biệt:

   - Service: cung cấp chức năng để code của plugin khác gọi.
   - Tool: cung cấp chức năng thông qua Tool Registry để AI model có thể yêu cầu thực thi.

   Ví dụ với DeckAgent:

   - `PresentationService` có thể cung cấp phương thức `createSlide()`.
   - `create_slide` Tool có thể sử dụng `PresentationService` để tạo slide khi model yêu cầu.

   Như vậy, Tool không nhất thiết phải tự triển khai toàn bộ logic; nó có thể gọi Service bên dưới. Đây là ví dụ kiến trúc giả định cho DeckAgent.

3. **Điểm mới thứ hai: Tool Definition và Tool Execution là hai việc khác nhau.**

   - Tool Definition:

     ```ts
     defineTool({
       name: 'greet',
       description: 'Greet the named person.',
       parameters: { /* ... */ },
       output: { /* ... */ },
       async execute(args) { /* ... */ }
     })
     ```

     Định nghĩa tên tool, chức năng, tham số, kết quả và logic thực thi. `defineTool()` còn tạo JSON Schema cho model và kiểm tra arguments trước khi gọi `execute()`.

   - Tool Execution:

     ```ts
     await ctx.tools.execute({
       callId: brandString<ToolCallId>('demo-1'),
       name: 'greet',
       arguments: { name: 'Cordis' },
       signal: new AbortController().signal,
     })
     ```

     Đây là lời gọi yêu cầu Harness thực thi tool đã đăng ký.

   Điểm quan trọng: trong tutorial, người viết code chủ động gọi `ctx.tools.execute()`; chưa có AI model nào tham gia. Tutorial đang mô phỏng một tool call từ model để kiểm tra Tool Pipeline.

4. **Điểm mới thứ ba: Tool Result có hai dạng.**

   - `output.schema`: xác định cấu trúc giá trị chính mà `execute()` trả về.
   - `output.render`: chuyển giá trị đó thành các content blocks để sử dụng làm kết quả tool.

   Ví dụ, giá trị chính là một string:

   ```ts
   async execute(args) {
     return `Hello, ${args.name}!`
   }
   ```

   Sau đó được chuyển thành text content block:

   ```ts
   render: (_args, value) => [
     { type: 'text', text: value }
   ]
   ```

   Tutorial cho biết nội dung được render là kết quả chuẩn hóa và được lưu bền vững. Điều này quan trọng với DeckAgent vì kết quả thực thi của tool và nội dung đưa vào lịch sử agent không nhất thiết phải giống nhau. Tuy nhiên, Chapter 7 chưa giải thích đầy đủ cách Harness lưu file presentation hoặc quản lý artifact.

5. **Điểm mới thứ tư: Quan sát Tool Pipeline bằng Events.**

   Cơ chế `ctx.on()` đã trình bày ở Chapter 4 được dùng để theo dõi tool calls:

   ```ts
   ctx.on('tools/result', (exec, result) => {
     console.log(exec.name, result.content)
   })
   ```

   Nghĩa là:

   - `greet-tool` đăng ký và thực thi tool.
   - `tool-logger` lắng nghe event `tools/result`.
   - Hai plugins không cần biết trực tiếp về nhau.

   Một chi tiết mới là event `tools/result` được phát trong quá trình tạo kết quả, trước khi Promise của `ctx.tools.execute()` hoàn thành. Vì vậy, log của observer xuất hiện trước log của caller.

6. **Điều quan trọng nhất đối với DeckAgent.**

   Sau Chapter 7, có thể hình dung một hướng mở rộng DeepSeek Harness:

   1. AI Model yêu cầu gọi `create_slide`.
   2. Harness Tools Service tìm tool đã đăng ký và thực thi.
   3. Presentation Tool gọi logic tạo slide.
   4. Presentation Service tạo hoặc chỉnh sửa slide.
   5. Tool Result + event `tools/result` trả kết quả và cho phép plugin khác quan sát.

   Đây là sơ đồ đề xuất cho DeckAgent, không phải một implementation đã tồn tại trong DeepSeek Harness.

   Điều này xác nhận một phần giả thuyết nghiên cứu: DeepSeek Harness có cơ chế để bổ sung tool chuyên biệt mà không cần viết lại Tool Registry. Nhưng Chapter 7 chưa chứng minh rằng chỉ cần một Presentation Preset là đủ để xây dựng DeckAgent; vẫn cần hiểu Agent Loop, cách model chọn tools và cách Harness quản lý artifacts.

7. **Công thức tổng hợp.**

   Model-callable Tool = Tool Definition + Tool Registration + Tool Execution + Tool Result

   - Tool Definition: khai báo tên, mô tả, parameters, output và logic thực thi.
   - Tool Registration: đăng ký tool với `ctx.tools.register()`.
   - Tool Execution: Harness thực thi tool thông qua `ctx.tools.execute()`.
   - Tool Result: chuẩn hóa kết quả theo `output.schema` và `output.render`.

   `tools/result` là event để các plugins khác quan sát kết quả thực thi.

Kết luận: Chapter 7 cho thấy Cordis không chỉ kết nối các plugins với nhau. DeepSeek Harness sử dụng Cordis để cung cấp những khả năng mà AI model có thể gọi thông qua Tool Pipeline. Đây là bước đầu tiên kết nối kiến trúc plugin với cơ chế thực thi của AI Agent.

### Cordis Summary

Để chuyển sang nghiên cứu Agent Harness, chỉ cần nắm các cơ chế cốt lõi của Cordis, chưa cần hiểu toàn bộ implementation. Chốt thành 6 nhóm:

| Thành phần | Điều cần hiểu |
| --- | --- |
| Plugin | Đơn vị mở rộng chức năng. Có Function, Object và Class Plugin. |
| Context | Đối tượng `ctx` mà Cordis cung cấp để plugin truy cập và đăng ký các khả năng. |
| Service | API mà một plugin cung cấp để các plugins khác sử dụng. |
| Tool | Chức năng được đăng ký để AI Model có thể yêu cầu Harness thực thi. |
| Events | Cho phép plugins giao tiếp mà không cần biết trực tiếp plugin nhận event. |
| Composition & Lifecycle | `cordis.yml`, `inject`, mount/unmount, dependency management, configuration và HMR. |

Có hai điểm cần phân biệt:

- Tool thuộc lớp khả năng của DeepSeek Harness, được triển khai trên nền Cordis; không phải khái niệm bắt buộc của mọi ứng dụng Cordis.
- `cordis.yml` không trực tiếp quản lý toàn bộ dependency; nó khai báo thành phần ứng dụng. Cordis dùng `inject` và trạng thái services để quản lý dependency lifecycle.

#### Khi nào coi như đã hiểu đủ Cordis?

Khi giải thích được luồng sau:

```
cordis.yml
    |
    v
Cordis Loader
    |
    v
Mount Plugins
    |
    +-- Provide Services
    |
    +-- Inject Required Services
    |
    +-- Register Events
    |
    +-- Register Tools (DeepSeek Harness)
    |
    v
Agent Harness sử dụng các capabilities
```

Không cần nghiên cứu sâu ngay các thuật toán nội bộ của Cordis, HMR hay Service Isolation, trừ khi chúng trở thành vấn đề kiến trúc của DeckAgent.

Bước tiếp theo: chuyển trọng tâm từ câu hỏi "Cordis lắp ráp các plugins thế nào?" sang "Agent Loop sử dụng Model, Tools, Session và Context thế nào để hoàn thành một yêu cầu?" — đây mới là phần nghiên cứu quan trọng tiếp theo đối với DeckAgent.

