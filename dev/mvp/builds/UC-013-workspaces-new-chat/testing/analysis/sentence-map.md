---
scope: "Workspace theo folder (UC-013) và chat mới (UC-012)"
title: "Sentence map — workspace theo folder và chat mới"
milestone: mvp
created: 09-11-2026
---

# Sentence map — workspace theo folder và chat mới

<!-- Record của Gate 1, nằm cạnh test-analysis.md (dev/development/test-strategy.md "Test basis register"). File này cho PO đếm lại register: đi từ một đơn vị tới item của nó, và từ một item về đơn vị của nó. Item nằm ở basis-register.md; số tổng được chép vào test-analysis.md mục 1.
     Build file viết bằng tiếng Việt với thuật ngữ tiếng Anh (dev/mvp/builds/_STYLE.md). -->

## Contents

- [At a glance](#at-a-glance)
- [Totals](#totals)
- [UC-013](#uc-013)
- [UC-012](#uc-012)
- [FR-071](#fr-071)
- [FR-072](#fr-072)
- [FR-073](#fr-073)
- [FR-074](#fr-074)
- [FR-083](#fr-083)
- [FR-084](#fr-084)
- [FR-141](#fr-141)
- [FR-142](#fr-142)
- [FR-053](#fr-053)
- [FR-048](#fr-048)
- [FR-038](#fr-038)
- [NFR-008](#nfr-008)
- [BR-004](#br-004)
- [BR-019](#br-019)
- [BR-020](#br-020)
- [FR-143](#fr-143)

## At a glance

- **Mục đích:** **mọi đơn vị** của spec trong scope, **class** của nó và **item** nó cấp dữ liệu, để PO **đếm lại** register.
- **Item:** [basis-register.md](./basis-register.md) · **Số đếm:** [test-analysis.md](./test-analysis.md) mục 1
- **Status:** _230 đơn vị · 0 đơn vị normative chưa có item_

## Totals



Cột "Normative chưa có item" đếm từ bảng dưới: đơn vị N không dẫn tới item nào. Một người đọc làm bảng này, nên con số 0 là kết quả tự đếm; PO đếm lại được từ bảng.

| Spec | Đơn vị | Normative | Explanatory | Definition | Normative chưa có item |
|---|---|---|---|---|---|
| UC-013 | 89 | 75 | 3 | 11 | 0 |
| UC-012 | 28 | 18 | 2 | 8 | 0 |
| FR-071 | 11 | 9 | 0 | 2 | 0 |
| FR-072 | 4 | 4 | 0 | 0 | 0 |
| FR-073 | 6 | 6 | 0 | 0 | 0 |
| FR-074 | 5 | 3 | 0 | 2 | 0 |
| FR-083 | 4 | 4 | 0 | 0 | 0 |
| FR-084 | 5 | 3 | 0 | 2 | 0 |
| FR-141 | 6 | 6 | 0 | 0 | 0 |
| FR-142 | 11 | 6 | 2 | 3 | 0 |
| FR-053 | 9 | 8 | 1 | 0 | 0 |
| FR-048 | 4 | 4 | 0 | 0 | 0 |
| FR-038 | 4 | 4 | 0 | 0 | 0 |
| NFR-008 | 6 | 3 | 2 | 1 | 0 |
| BR-004 | 7 | 5 | 1 | 1 | 0 |
| BR-019 | 14 | 10 | 4 | 0 | 0 |
| BR-020 | 10 | 8 | 2 | 0 | 0 |
| FR-143 | 7 | 2 | 2 | 3 | 0 |
| **Tổng** | **230** | **178** | **19** | **33** | **0** |

<!-- Mọi đơn vị (câu, hoặc mệnh đề kết thúc bằng ";") của mọi spec trong scope, theo thứ tự đọc. Locator: mục của spec và số thứ tự của đơn vị trong mục đó; chữ cái a, b, c đánh các mệnh đề cách nhau bằng ";" trong cùng một câu. Class: N normative, E explanatory, D definition, quyết định theo nội dung của đơn vị, không theo scope. Cột Items là các item mà đơn vị N cấp dữ liệu, kể cả đơn vị mà một spec ngoài build sở hữu hành vi (item của nó deferred). Đơn vị D chỉ trỏ sang spec khác hoặc nêu ranh giới. Mục "Product evidence" của UC là bản ghi nghiên cứu nên không đếm. Bảng Steps của UC chỉ là ánh xạ UC sang FR nên không đếm. -->

## UC-013

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Diagram S1 · step | Choose to work in another workspace | N | UC-013.S1 |
| Diagram S1 · 1 | Shows each workspace that is set up | N | UC-013.S1 |
| Diagram S1 · 2 | Keeps the current chat and its draft | N | UC-013.S1 |
| Diagram S2 · step | Choose a folder on the computer | N | UC-013.S2a, UC-013.S2b |
| Diagram S2 · 1 | Sets up a workspace for the folder | N | UC-013.S2a |
| Diagram S2 · 2 | Reads no file of the folder and sends nothing | N | UC-013.S2a, UC-013.S2b |
| Diagram S2 · 3 | Changes no file of the user | N | UC-013.S2a |
| Diagram S2 · 4 | Keeps the current chat and its draft | N | UC-013.S2a |
| Diagram S2 · 5 | Keeps every active request running | N | UC-013.S2b |
| Diagram S3 · step | Work in the workspace in use | N | UC-013.S3a, UC-013.S3b |
| Diagram S3 · 1 | Shows the chats of the workspace in use | N | UC-013.S3b |
| Diagram S3 · 2 | Puts each new chat in the workspace | N | UC-013.S3a |
| Diagram S3 · 3 | Creates, changes and deletes no file | N | UC-013.S3a |
| A1 · When | The chosen folder is the project folder | N | UC-013.A1 |
| A1 · System 1 | Makes that workspace the workspace in use | N | UC-013.A1 |
| A1 · System 2 | Sets up no second workspace | N | UC-013.A1 |
| A2 · When | The user removes a workspace other than the default | N | UC-013.A2a |
| A2 · System 1 | Says that its project folder and its chats stay | N | UC-013.A2a |
| A2 · System 2 | On confirm: removes the workspace | N | UC-013.A2a |
| A2 · System 3 | Makes its chats ungrouped chats | N | UC-013.A2a, UC-013.A2b, UC-013.A2c, UC-013.A2d |
| A2 · System 4 | When it was the workspace in use | N | UC-013.A2a |
| A2 · System 5 | On cancel: removes nothing | N | UC-013.A2a |
| A3 · When | The project folder of a workspace cannot be read | N | UC-013.A3 |
| A3 · System 1 | Says that the files of the folder cannot be read | N | UC-013.A3 |
| A3 · System 2 | Says what the user does next | N | UC-013.A3 |
| A3 · System 3 | Names no cause it does not know | N | UC-013.A3 |
| A3 · System 4 | Keeps the workspace set up and every chat of it | N | UC-013.A3 |
| A5 · When | The user removes a workspace, or chooses another folder | N | UC-013.A5 |
| A5 · System 1 | Changes no workspace | N | UC-013.A5 |
| A5 · System 2 | Says that the request must end first | N | UC-013.A5 |
| A5 · System 3 | Stops no request | N | UC-013.A5 |
| A6 · When | For a workspace other than the default | N | UC-013.A6a, UC-013.A6b |
| A6 · System 1 | Makes the chosen folder the project folder | N | UC-013.A6a |
| A6 · System 2 | Keeps the workspace and its chats | N | UC-013.A6a |
| A6 · System 3 | Reads no file of the folder and sends nothing | N | UC-013.A6a, UC-013.A6b |
| A7 · When | The user chooses a workspace that is set up | N | UC-013.A7a, UC-013.A7b |
| A7 · System 1 | Makes it the workspace in use | N | UC-013.A7a |
| A7 · System 2 | Asks for no folder and changes no file | N | UC-013.A7a |
| A7 · System 3 | Keeps the current chat and its draft | N | UC-013.A7a |
| A7 · System 4 | Keeps every active request running | N | UC-013.A7b |
| A8 · When | The folder the user chooses for a workspace is | N | UC-013.A8 |
| A8 · System 1 | Changes neither workspace | N | UC-013.A8 |
| A8 · System 2 | Says which workspace has the folder | N | UC-013.A8 |
| A9 · When | The user chooses no folder, or the chosen folder | N | UC-013.A9 |
| A9 · System 1 | Sets up no workspace | N | UC-013.A9 |
| A9 · System 2 | Keeps the workspace in use as it was | N | UC-013.A9 |
| A9 · System 3 | For a folder that cannot be read: says so | N | UC-013.A9 |
| A9 · System 4 | For a folder that cannot be a project folder | N | UC-013.A9 |
| A10 · When | DeckAgent starts on the computer for the first time | N | UC-013.A10 |
| A10 · System 1 | Makes the default workspace the workspace in use | N | UC-013.A10 |
| A10 · System 2 | Asks for no folder | N | UC-013.A10 |
| A11 · When | The user gives a workspace a new name | N | UC-013.A11a, UC-013.A11b |
| A11 · System 1 | Gives the workspace that name | N | UC-013.A11a |
| A11 · System 2 | Keeps its project folder and its chats | N | UC-013.A11a |
| A11 · System 3 | Changes no file of the user | N | UC-013.A11a |
| A11 · System 4 | Keeps every active request running | N | UC-013.A11b |
| A12 · When | The place of the project folder of a workspace holds | N | UC-013.A12 |
| A12 · System 1 | Says that a different folder is now there | N | UC-013.A12 |
| A12 · System 2 | Reads no file of that folder | N | UC-013.A12 |
| A12 · System 3 | Offers to use that folder for the workspace | N | UC-013.A12 |
| A12 · System 4 | Keeps the workspace set up and every chat of it | N | UC-013.A12 |
| A13 · When | The name the user gives a workspace (A11) | N | UC-013.A13 |
| A13 · System 1 | Keeps the name of the workspace | N | UC-013.A13 |
| A13 · System 2 | Says why the name is refused | N | UC-013.A13 |
| A13 · System 3 | Changes no file of the user | N | UC-013.A13 |
| Situation and goal · 1 | The user keeps the files of each project | E | — |
| Situation and goal · 2 | They want the chats of a project grouped | E | — |
| Situation and goal · 3 | They also want to start before choosing any folder | E | — |
| Trigger · 1 | The user chooses to work in another workspace, to choose | D | Mở đầu các flow UC-013.S1, A2a, A6a, A11a (đã là item) |
| Trigger · 2 | or DeckAgent starts on the computer for the first time | D | Mở đầu flow UC-013.A10 |
| Precondition · 1 | DeckAgent runs on the user's computer | D | Xem AM-4 |
| Outcome · 1 | The workspace in use is the one the user chose | N | UC-013.S2a, UC-013.A7a |
| Outcome · 2 | Every file of the user in its project folder is as it was | N | UC-013.G1 |
| Minimal guarantee · 1 | No file of the user is changed, moved or deleted | N | UC-013.G1 |
| Minimal guarantee · 2 | No chat, conversation or deck is deleted | N | UC-013.G2a, UC-013.G2b, UC-013.G2c |
| Minimal guarantee · 3 | No active request stops | N | UC-013.G3 |
| Notes · 1 | Where the deck source and the work of a chat are kept | D | Thuộc DEC-006 (open) |
| Notes · 2a | The agent of a chat reads the files ... and writes none there | N | UC-013.N1, UC-013.S3a |
| Notes · 2b | Starting a new chat is UC-012 | D | Thuộc UC-012 |
| Notes · 3a | A file of the project folder is named in the request text | N | UC-013.N2 |
| Notes · 3b | there is no named reference | N | UC-013.N2 |
| Notes · 3c | A file that cannot be read is UC-003 A43 | D | Thuộc UC-003 |
| Notes · 4a | Opening an earlier chat ... is UC-006 | D | Thuộc UC-006 |
| Notes · 4b | An ungrouped chat joins no workspace | N | FR-073.N2a |
| Notes · 4c | adding its former project folder again sets up a new workspace | N | FR-071.N1 |
| Notes · 5a | Renaming or deleting a chat is not a flow of this case | D | Thuộc UC-018 (backlog) |
| Notes · 5b | It is in the backlog (UC-018) | D | Thuộc UC-018 (backlog) |
| Notes · 6a | Next free flow ID: A14 | D | — |
| Notes · 6b | A number below it that this file does not hold is not used | D | — |

## UC-012

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Diagram S1 · step | Choose to start a new chat | N | UC-012.S1a, UC-012.S1b, UC-012.S1c |
| Diagram S1 · 1 | Keeps the chat the user leaves, its deck and its draft | N | UC-012.S1a, UC-012.S1b |
| Diagram S1 · 2 | Keeps its active request running there | N | UC-012.S1c |
| Diagram S1 · 3 | Makes a new chat the current chat | N | UC-012.S1a |
| Diagram S1 · 4 | Takes nothing from another chat | N | UC-012.S1a |
| Diagram S2 · step | Get ready to write the first request | N | UC-012.S2a, UC-012.S2b, UC-012.S2c |
| Diagram S2 · 1 | Shows the selected model of the new chat | N | UC-012.S2a |
| Diagram S2 · 2 | Sends nothing and builds no deck | N | UC-012.S2b, UC-012.S2c |
| Diagram S2 · 3 | Accepts a first request | N | UC-012.S2b |
| A1 · When | No model was ever chosen, or the model of the most recent choice | N | UC-012.A1a, UC-012.A1b |
| A1 · System 1 | Leaves the new chat with no selected model and says so | N | UC-012.A1a, UC-012.A1b |
| A1 · System 2 | Chooses no other model by itself | N | UC-012.A1a, UC-012.A1b |
| Situation and goal · 1 | The user worked on one deck | E | — |
| Situation and goal · 2 | They want the new work free of the earlier conversation | E | — |
| Trigger · 1 | The user chooses to start a new chat | D | Mở đầu flow UC-012.S1a |
| Precondition · 1 | DeckAgent runs on the user's computer | D | Xem AM-4 |
| Outcome · 1 | A new, empty chat of the workspace in use is the current chat | N | UC-012.S1a, UC-012.S2a, UC-012.A1a |
| Outcome · 2 | Every other chat is as it was | N | UC-012.S1a |
| Minimal guarantee · 1 | Every other chat, its deck and its draft are as they were | N | UC-012.S1a, UC-012.S1b, UC-012.S1c |
| Notes · 1a | Drafting the first deck in the new chat is UC-001 | D | Thuộc UC-001 |
| Notes · 1b | going back to an earlier chat is UC-006 | D | Thuộc UC-006 |
| Notes · 1c | the workspace a new chat joins is UC-013 | D | Thuộc UC-013 |
| Notes · 2a | Sending a request in a chat with no selected model is UC-003 A17 | D | Thuộc UC-003 |
| Notes · 2b | choosing another model for the chat is UC-005 A16 | D | Thuộc UC-005 |
| Notes · 3 | A chat holds at most one deck | N | FR-053.N2 |
| Notes · 4a | An exported source archive attached in a new chat | N | UC-012.N1 |
| Notes · 4b | nothing is imported as a deck to change | N | UC-012.N1 |
| Notes · 4c | Carrying on with an exported deck is in the backlog | D | Thuộc UC-019 (backlog) |

## FR-071

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the user chooses a readable folder | N | FR-071.1, FR-071.2, FR-071.3, FR-071.15 |
| Statement · 2 | a folder that is already the project folder | N | FR-071.4 |
| Statement · 3 | When that folder was moved to another place | N | FR-071.5 |
| Statement · 4 | Switching to a workspace that is set up asks for no folder | N | FR-071.6, FR-071.7 |
| Statement · 5 | A folder that cannot be a project folder [BR-019] | N | FR-071.8 |
| Statement · 6 | the system says why and that a folder inside it | N | FR-071.8 |
| Statement · 7 | Adding or switching keeps the current chat and its draft | N | FR-071.9, FR-071.10, FR-071.11, FR-071.12, FR-071.13, FR-071.14 |
| Notes · 1 | Renaming a workspace is FR-141 | D | Thuộc FR-141 |
| Notes · 2a | A folder that had a removed workspace sets up a new workspace | N | FR-071.N1 |
| Notes · 2b | the chats of the removed one stay ungrouped chats | N | FR-071.N1 |
| Notes · 3 | Starting a new chat is FR-053 | D | Thuộc FR-053 |

## FR-072

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | From the first start on the computer | N | FR-072.1, FR-072.2, FR-072.3 |
| Statement · 2 | On every later start, the workspace in use | N | FR-072.4a, FR-072.4b |
| Statement · 3 | The user works in it without choosing a folder | N | FR-072.5 |
| Statement · 4 | The system never removes the default workspace | N | FR-072.6, FR-072.7a, FR-072.7b, FR-072.7c |

## FR-073

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | The system removes a workspace other than the default | N | FR-073.1, FR-073.2 |
| Statement · 2 | Removing changes no folder and no file | N | FR-073.3, FR-073.4a, FR-073.4b, FR-073.4c, FR-073.4d, FR-073.5 |
| Statement · 3 | While a request in a chat of the workspace is active | N | FR-073.6a, FR-073.6b, FR-073.6c |
| Notes · 1 | An ungrouped chat has no project folder | N | FR-073.N1a, FR-073.N1b |
| Notes · 2a | An ungrouped chat joins no workspace | N | FR-073.N2a |
| Notes · 2b | Adding its former project folder again | N | FR-071.N1 |

## FR-074

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the project folder of a workspace cannot be read | N | FR-074.1, FR-074.2, FR-074.3 |
| Statement · 2 | It names no cause it does not know | N | FR-074.4, FR-074.5 |
| Statement · 3 | The workspace stays set up | N | FR-074.6, FR-074.7a, FR-074.7b, FR-074.7c |
| Notes · 1 | A file of the folder that a request needs | D | Thuộc FR-067 |
| Notes · 2 | A different folder at the place of the project folder | D | Thuộc FR-142 |

## FR-083

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the user chooses another folder for a workspace | N | FR-083.1, FR-083.2, FR-083.3, FR-083.4 |
| Statement · 2 | When the chosen folder is the project folder of another workspace | N | FR-083.5, FR-083.6, FR-083.7 |
| Statement · 3 | While a request in a chat of the workspace is active | N | FR-083.8a, FR-083.8b, FR-083.8c |
| Statement · 4 | The default workspace has no project folder | N | FR-083.9 |

## FR-084

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | While the system works on a request | N | FR-084.1a, FR-084.1b, FR-084.1c |
| Statement · 2 | A file the user gave as an attachment | N | FR-084.2 |
| Statement · 3 | A file appears in the project folder only through an export | N | FR-084.3 |
| Notes · 1 | Where the deck source and the rest of the work | D | Thuộc DEC-006 (open) |
| Notes · 2 | Export ... is in the backlog | D | Thuộc UC-004, FR-085 (backlog) |

## FR-141

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the user gives a workspace a new name | N | FR-141.1 |
| Statement · 2 | Renaming keeps the project folder and the chats | N | FR-141.2, FR-141.3, FR-141.4 |
| Statement · 3 | Two workspaces are allowed to have the same name | N | FR-141.5 |
| Statement · 4 | The system drops the whitespace at both ends | N | FR-141.6 |
| Statement · 5 | The system keeps the name in NFC form | N | FR-141.9 |
| Statement · 6 | A name the system refuses [BR-020] | N | FR-141.7, FR-141.8 |

## FR-142

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the place of the project folder of a workspace holds | N | FR-142.1, FR-142.2, FR-142.3 |
| Statement · 2 | The user can use that folder for the workspace | N | FR-142.4 |
| Statement · 3 | on that choice the system makes it the project folder | N | FR-142.4 |
| Statement · 4 | Until then, the workspace stays set up | N | FR-142.5, FR-142.6a, FR-142.6b, FR-142.6c |
| Why · 1 | A folder at the old place looks like the chosen folder | E | — |
| Why · 2 | using it without asking would let the agent read files | E | — |
| Notes · 1 | When two paths are the same folder | D | Thuộc windows-folders.md |
| Notes · 2a | The conditions of choosing another folder are FR-083 | D | Thuộc FR-083 |
| Notes · 2b | a folder that cannot be read at all is FR-074 | D | Thuộc FR-074 |
| Notes · 3a | Adding the different folder as a workspace | N | FR-142.N3 |
| Notes · 3b | the first workspace keeps reporting a different folder | N | FR-142.N3 |

## FR-053

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | Starting a new chat keeps every other chat | N | FR-053.1a, FR-053.1b, FR-053.1c, FR-053.2 |
| Statement · 2 | The new chat becomes the current chat | N | FR-053.3, FR-053.4, FR-053.5 |
| Statement · 3 | It gets the selected model and the reasoning level | N | FR-053.6, FR-053.7a, FR-053.7b |
| Why · 1 | Carry on with the model the user chose last | E | — |
| Notes · 1a | The system does not walk back through earlier choices | N | FR-053.N1a |
| Notes · 1b | The draft of each chat is kept whole | N | FR-053.1c, FR-038.1a |
| Notes · 1c | A model removed and added again counts | N | FR-053.N1b |
| Notes · 1d | The reach of the agent is the same for every chat | N | FR-053.N1c |
| Notes · 2 | A chat holds at most one deck (glossary) | N | FR-053.N2 |

## FR-048

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When the user asks for earlier work | N | FR-048.1, FR-048.2, FR-048.3 |
| Statement · 2 | It names each chat from its content | N | FR-048.4, FR-048.5, FR-048.6 |
| Statement · 3 | With no such chat it says so | N | FR-048.7 |
| Notes · 1 | A chat of a removed workspace becomes an ungrouped chat | N | FR-073.4a |

## FR-038

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | The system keeps the draft of each chat | N | FR-038.1a, FR-038.1b |
| Statement · 2 | It also keeps the draft when the interface is reloaded | N | FR-038.2, FR-038.3 |
| Statement · 3 | Going elsewhere adds nothing to the draft | N | FR-038.4a, FR-038.4b |
| Statement · 4 | The draft is not kept after DeckAgent stops | N | FR-038.5 |

## NFR-008

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Quality attribute · 1 | data integrity | D | Tên thuộc tính chất lượng |
| Statement · 1 | When DeckAgent ends unexpectedly | N | NFR-008.1a, NFR-008.1b, NFR-008.1c |
| Statement · 2 | After DeckAgent starts again | N | NFR-008.2a, NFR-008.2b |
| Statement · 3 | No unfinished change to a slide | N | NFR-008.3 |
| Notes · 1 | It makes no promise that a result shown just before the end | E | — |
| Notes · 2 | The draft of a chat is not covered | E | — |

## BR-004

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | The rule sets which chats the system keeps | D | Mô tả phạm vi của luật |
| V-1 · 1 | Every chat in which the user sent at least one request | N | BR-004.V1 |
| V-1 · 2 | A chat with no sent request is not required to appear | N | BR-004.V1 |
| V-2 · 1 | No time limit | N | BR-004.V2 |
| V-2 · 2 | The system deletes no chat, conversation or deck because of its age | N | BR-004.V2 |
| V-3 · 1 | Every chat of a removed workspace is kept | N | BR-004.V3 |
| Notes · 1 | No time limit is no promise against a loss | E | — |

## BR-019

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | The folders that the system refuses as a project folder | N | BR-019.R0 |
| Statement · 2 | A folder refused by one value is refused | N | BR-019.R1 |
| Why · 1 | The agent reads every file of the project folder | E | — |
| Why · 2 | a folder too wide or holding keys | E | — |
| Why · 3 | DeckAgent writes nothing in a project folder | E | — |
| V-1 · 1 | the root of every drive | N | BR-019.V1 |
| V-2 · 1 | C:\Windows, C:\Program Files and C:\Program Files (x86) | N | BR-019.V2a, BR-019.V2b, BR-019.V2c |
| V-2 · 2 | Closed list | N | BR-019.V2a |
| V-3 · 1 | the user's own folder (such as `C:\Users\<name>`) | N | BR-019.V3a |
| V-3 · 2 | a folder inside it is not refused by this value | N | BR-019.V3b |
| V-4 · 1 | .ssh, .aws, .gnupg, .kube and .docker in the user's own folder | N | BR-019.V4a, BR-019.V4b |
| V-4 · 2 | Closed list | N | BR-019.V4a |
| V-5 · 1 | the folder of DeckAgent's own data | N | BR-019.V5a, BR-019.V5b, BR-019.V5c |
| Notes · 1 | V-1 to V-5 follow open-design | E | — |

## BR-020

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | The names that the system refuses for a workspace | N | BR-020.R |
| Why · 1 | A name with no character cannot be told apart | E | — |
| Why · 2 | a very long name breaks the list | E | — |
| V-1 · 1 | a name with no character once the whitespace | N | BR-020.V1 |
| V-2 · 1 | at most 100 characters, inclusive | N | BR-020.V2a |
| V-2 · 2 | a longer name is refused | N | BR-020.V2a |
| V-2 · 3 | A character is one Unicode code point after NFC | N | BR-020.V2b |
| V-2 · 4 | The name is normalized to NFC before its characters | N | BR-020.V2c |
| V-3 · 1 | the characters that JavaScript String.prototype.trim() drops | N | BR-020.V3 |
| V-3 · 2 | The system drops them from a name the user gives | N | BR-020.V3 |

## FR-143

| Locator | Starts with | Class | Items |
|---|---|---|---|
| Statement · 1 | When an operation that changes the state of a workspace | N | FR-143.1 |
| Statement · 2 | A web page outside DeckAgent is not an allowed client | N | FR-143.2 |
| Why · 1 | The system runs on the user's computer | E | — |
| Why · 2 | without this, a web page the user opens | E | — |
| Notes · 1 | The system does not protect against another process | D | Giới hạn đã khai của AM-5 (ranh giới của FR-143) |
| Notes · 2 | The system has no user login | D | Ranh giới của FR-143 |
| Notes · 3 | How the system tells an allowed client from another | D | Thuộc implementation plan |
