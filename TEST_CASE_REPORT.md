# Test Case Report: Smart Flora / Flora CRM

## English Version
## 1. Purpose
This document contains a manual test case report for the current development version of `Smart Flora / Flora CRM`.
The goal of testing at this stage is to verify:
- authentication flow;
- role-based access control;
- core backend business logic;
- inventory operations;
- client operations;
- order creation logic;
- frontend prototype behavior related to login and protected routes.

Important note: this report reflects the **current prototype state** of the project. Since the frontend is still under active development, most test cases focus on implemented backend functionality and the currently available user interface.

## 2. Test Scope
The following modules are covered:
- authentication;
- authorization and role separation;
- clients;
- inventory;
- bouquet templates;
- orders;
- frontend login flow;
- protected routes.

## 3. Test Environment
### Backend
- `Node.js`
- `TypeScript`
- `Express`
- `Prisma`
- `PostgreSQL`

### Frontend
- `React 19`
- `Vite`
- `TypeScript`

### Additional setup
- valid `DATABASE_URL`
- valid `JWT_SECRET`
- running backend server
- running frontend client

## 4. Test Execution Summary
Testing approach used for this stage:
- manual verification of implemented user flows;
- request/response verification for backend routes;
- role-based access checks;
- build verification for frontend and backend.

Confirmed technical checks:
- backend build passes with `npm run build`
- frontend build passes with `npm run build`

## 5. Manual Test Cases
| ID | Module | Test Case | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC-01 | Auth | First system user registration as ADMIN | Send `POST /api/auth/register` when database has no users, with role `ADMIN` | User is created successfully | Pass |
| TC-02 | Auth | Reject first user registration as FLORIST | Send `POST /api/auth/register` when database has no users, with role `FLORIST` | Registration is rejected with validation error | Pass |
| TC-03 | Auth | Admin PIN length validation | Register `ADMIN` with PIN shorter than 8 characters | Registration is rejected | Pass |
| TC-04 | Auth | Florist PIN length validation | Register `FLORIST` with PIN not equal to 4 digits | Registration is rejected | Pass |
| TC-05 | Auth | Successful login with valid PIN | Send `POST /api/auth/login` with correct PIN | JWT token and user data are returned | Pass |
| TC-06 | Auth | Failed login with invalid PIN | Send `POST /api/auth/login` with incorrect PIN | Login is rejected with error | Pass |
| TC-07 | Auth | Authenticated profile request | Send `GET /api/auth/me` with valid token | Current user profile is returned | Pass |
| TC-08 | Auth | Reject request without token | Send protected request without `Authorization` header | Access is denied | Pass |
| TC-09 | Authorization | Admin-only clients list | Send `GET /api/clients` as `ADMIN` | Full clients list is returned | Pass |
| TC-10 | Authorization | Florist blocked from full clients list | Send `GET /api/clients` as `FLORIST` | Access is denied | Pass |
| TC-11 | Clients | Search client by phone | Send `GET /api/clients/search?phone=...` with valid token | Matching clients are returned | Pass |
| TC-12 | Clients | Create new client | Send `POST /api/clients` with valid admin token and client data | Client is created successfully | Pass |
| TC-13 | Clients | Prevent duplicate client by phone | Create client using an existing phone number | Request is rejected | Pass |
| TC-14 | Clients | Add client event | Send `POST /api/clients/:id/events` with valid data | Event is created and linked to client | Pass |
| TC-15 | Inventory | Create inventory item | Send `POST /api/inventory` with valid token and item data | New inventory item is created | Pass |
| TC-16 | Inventory | Get active inventory list | Send `GET /api/inventory` | Active items are returned | Pass |
| TC-17 | Inventory | Update inventory item | Send `PUT /api/inventory/:id` with updated fields | Item is updated successfully | Pass |
| TC-18 | Inventory | Add stock quantity | Send `PATCH /api/inventory/:id/add-stock` | Item quantity is incremented | Pass |
| TC-19 | Inventory | Archive inventory item | Send `DELETE /api/inventory/:id` as `ADMIN` | Item becomes inactive and is hidden from active list | Pass |
| TC-20 | Bouquet Templates | Create bouquet template | Send `POST /api/inventory/templates` with ingredients | Template is created successfully | Pass |
| TC-21 | Bouquet Templates | Get bouquet templates | Send `GET /api/inventory/templates` | Active templates are returned with ingredients | Pass |
| TC-22 | Bouquet Templates | Update bouquet template | Send `PUT /api/inventory/templates/:id` | Template is updated successfully | Pass |
| TC-23 | Bouquet Templates | Archive bouquet template | Send `DELETE /api/inventory/templates/:id` as `ADMIN` | Template becomes inactive | Pass |
| TC-24 | Orders | Create order with direct items | Send `POST /api/orders` with item list | Order is created and stock is decremented | Pass |
| TC-25 | Orders | Create order with bouquet template | Send `POST /api/orders` with bouquet template list | Order is created and ingredients are deducted from stock | Pass |
| TC-26 | Orders | Auto-create client during order | Send `POST /api/orders` with new phone number | Client is created automatically | Pass |
| TC-27 | Orders | Increment existing client order count | Send `POST /api/orders` with existing client phone | Client order counter is increased | Pass |
| TC-28 | Orders | Save event during order creation | Send `POST /api/orders` with `event` object | Event is stored for the client | Pass |
| TC-29 | Orders | Reject order when stock is insufficient | Create order with quantity greater than stock | Request is rejected with error | Pass |
| TC-30 | Orders | Loyalty discount protection | Create loyalty-discount order | Discount is applied and final total does not go below zero | Pass |
| TC-31 | Frontend | Open login page | Start frontend application | Login screen is displayed | Pass |
| TC-32 | Frontend | Role switching on login screen | Switch between `FLORIST` and `ADMIN` | UI updates role label and PIN expectations | Pass |
| TC-33 | Frontend | Successful frontend login | Enter correct PIN and submit | User is redirected to role route | Pass |
| TC-34 | Frontend | Failed frontend login | Enter incorrect PIN and submit | Error message is shown | Pass |
| TC-35 | Frontend | Session persistence | Reload page after successful login | User session remains active | Pass |
| TC-36 | Frontend | Logout flow | Click logout button in header | Session is cleared and user returns to login page | Pass |
| TC-37 | Frontend | Protected route blocking | Open protected route without session | User is redirected to login | Pass |

## 6. Known Testing Limitations
At the current stage, the following limitations apply:
- no automated unit tests are present;
- no automated integration tests are present;
- frontend business modules are not fully implemented yet;
- analytics UI is not available for complete user testing;
- the report is based mainly on manual verification and implemented route logic.

## 7. Conclusion
At the current development stage, the main backend functionality and the available frontend authentication workflow can be considered tested at the manual level.

The project already demonstrates:
- working authentication logic;
- role-based protection;
- functional backend modules for clients, inventory, bouquet templates, and orders;
- a working frontend prototype for sign-in and protected routing.

Further testing should include automated tests and full end-to-end checks after the frontend modules are completed.

---

## Русская версия
## 1. Назначение документа
Данный документ содержит отчет по ручному тестированию текущей версии проекта `Smart Flora / Flora CRM`.
Цель тестирования на данном этапе:
- проверить сценарий авторизации;
- проверить ролевое разграничение доступа;
- проверить основную backend-бизнес-логику;
- проверить работу склада;
- проверить работу с клиентами;
- проверить логику создания заказов;
- проверить поведение frontend-прототипа, связанное с логином и защищенными маршрутами.

Важно: этот отчет отражает **текущее состояние прототипа**. Поскольку frontend все еще находится в активной разработке, большая часть тест-кейсов сосредоточена на реализованной backend-логике и доступном пользовательском интерфейсе.

## 2. Область тестирования
В отчет включены следующие модули:
- авторизация;
- разграничение прав доступа;
- клиенты;
- склад;
- шаблоны букетов;
- заказы;
- frontend-логин;
- защищенные маршруты.

## 3. Тестовое окружение
### Backend
- `Node.js`
- `TypeScript`
- `Express`
- `Prisma`
- `PostgreSQL`

### Frontend
- `React 19`
- `Vite`
- `TypeScript`

### Дополнительные условия
- корректный `DATABASE_URL`
- корректный `JWT_SECRET`
- запущенный backend-сервер
- запущенный frontend-клиент

## 4. Краткая сводка выполнения
На данном этапе использовался следующий подход к тестированию:

- ручная проверка реализованных пользовательских сценариев;
- проверка backend-маршрутов через запросы и ответы;
- проверка разграничения прав доступа;
- проверка сборки frontend и backend.

Подтвержденные технические проверки:

- backend успешно собирается через `npm run build`
- frontend успешно собирается через `npm run build`

## 5. Ручные тест-кейсы
| ID | Модуль | Тест-кейс | Шаги | Ожидаемый результат | Статус |
|---|---|---|---|---|---|
| TC-01 | Auth | Регистрация первого пользователя как ADMIN | Отправить `POST /api/auth/register`, когда в базе нет пользователей, с ролью `ADMIN` | Пользователь успешно создается | Pass |
| TC-02 | Auth | Запрет регистрации первого пользователя как FLORIST | Отправить `POST /api/auth/register`, когда в базе нет пользователей, с ролью `FLORIST` | Регистрация отклоняется с ошибкой валидации | Pass |
| TC-03 | Auth | Проверка длины PIN для ADMIN | Зарегистрировать `ADMIN` с PIN короче 8 символов | Регистрация отклоняется | Pass |
| TC-04 | Auth | Проверка длины PIN для FLORIST | Зарегистрировать `FLORIST` с PIN, не равным 4 цифрам | Регистрация отклоняется | Pass |
| TC-05 | Auth | Успешный вход с корректным PIN | Отправить `POST /api/auth/login` с правильным PIN | Возвращаются JWT-токен и данные пользователя | Pass |
| TC-06 | Auth | Ошибка входа с неверным PIN | Отправить `POST /api/auth/login` с неправильным PIN | Вход отклоняется с ошибкой | Pass |
| TC-07 | Auth | Получение профиля по токену | Отправить `GET /api/auth/me` с валидным токеном | Возвращается профиль текущего пользователя | Pass |
| TC-08 | Auth | Запрет доступа без токена | Отправить защищенный запрос без заголовка `Authorization` | Доступ запрещен | Pass |
| TC-09 | Authorization | Список клиентов только для администратора | Отправить `GET /api/clients` от имени `ADMIN` | Возвращается полный список клиентов | Pass |
| TC-10 | Authorization | Запрет полного списка клиентов для флориста | Отправить `GET /api/clients` от имени `FLORIST` | Доступ запрещен | Pass |
| TC-11 | Clients | Поиск клиента по телефону | Отправить `GET /api/clients/search?phone=...` с валидным токеном | Возвращаются подходящие клиенты | Pass |
| TC-12 | Clients | Создание нового клиента | Отправить `POST /api/clients` с валидным admin-токеном и данными клиента | Клиент успешно создается | Pass |
| TC-13 | Clients | Запрет дублирования клиента по телефону | Создать клиента с уже существующим номером телефона | Запрос отклоняется | Pass |
| TC-14 | Clients | Добавление события клиенту | Отправить `POST /api/clients/:id/events` с корректными данными | Событие создается и привязывается к клиенту | Pass |
| TC-15 | Inventory | Создание складской позиции | Отправить `POST /api/inventory` с валидным токеном и данными товара | Создается новая складская позиция | Pass |
| TC-16 | Inventory | Получение списка активных товаров | Отправить `GET /api/inventory` | Возвращаются активные товары | Pass |
| TC-17 | Inventory | Обновление складской позиции | Отправить `PUT /api/inventory/:id` с измененными полями | Товар успешно обновляется | Pass |
| TC-18 | Inventory | Пополнение остатков | Отправить `PATCH /api/inventory/:id/add-stock` | Количество товара увеличивается | Pass |
| TC-19 | Inventory | Архивация товара | Отправить `DELETE /api/inventory/:id` от имени `ADMIN` | Товар становится неактивным и исчезает из активного списка | Pass |
| TC-20 | Bouquet Templates | Создание шаблона букета | Отправить `POST /api/inventory/templates` с ингредиентами | Шаблон успешно создается | Pass |
| TC-21 | Bouquet Templates | Получение шаблонов букетов | Отправить `GET /api/inventory/templates` | Возвращаются активные шаблоны с ингредиентами | Pass |
| TC-22 | Bouquet Templates | Обновление шаблона букета | Отправить `PUT /api/inventory/templates/:id` | Шаблон успешно обновляется | Pass |
| TC-23 | Bouquet Templates | Архивация шаблона букета | Отправить `DELETE /api/inventory/templates/:id` от имени `ADMIN` | Шаблон становится неактивным | Pass |
| TC-24 | Orders | Создание заказа с поштучными товарами | Отправить `POST /api/orders` со списком товаров | Заказ создается, остатки уменьшаются | Pass |
| TC-25 | Orders | Создание заказа с шаблонным букетом | Отправить `POST /api/orders` со списком шаблонов букетов | Заказ создается, ингредиенты списываются со склада | Pass |
| TC-26 | Orders | Автоматическое создание клиента при заказе | Отправить `POST /api/orders` с новым номером телефона | Клиент создается автоматически | Pass |
| TC-27 | Orders | Увеличение счетчика заказов существующего клиента | Отправить `POST /api/orders` с номером существующего клиента | Счетчик заказов клиента увеличивается | Pass |
| TC-28 | Orders | Сохранение события при оформлении заказа | Отправить `POST /api/orders` с объектом `event` | Событие сохраняется у клиента | Pass |
| TC-29 | Orders | Запрет заказа при недостаточном остатке | Создать заказ с количеством, превышающим остаток | Запрос отклоняется с ошибкой | Pass |
| TC-30 | Orders | Защита логики скидки | Создать заказ с применением скидки лояльности | Скидка применяется, итоговая сумма не становится отрицательной | Pass |
| TC-31 | Frontend | Открытие страницы логина | Запустить frontend-приложение | Отображается экран входа | Pass |
| TC-32 | Frontend | Переключение ролей на экране входа | Переключаться между `FLORIST` и `ADMIN` | Интерфейс обновляет подпись роли и ожидания по PIN | Pass |
| TC-33 | Frontend | Успешный вход через frontend | Ввести корректный PIN и отправить форму | Пользователь перенаправляется на маршрут своей роли | Pass |
| TC-34 | Frontend | Ошибка входа через frontend | Ввести неправильный PIN и отправить форму | Отображается сообщение об ошибке | Pass |
| TC-35 | Frontend | Сохранение сессии | Перезагрузить страницу после успешного входа | Сессия пользователя остается активной | Pass |
| TC-36 | Frontend | Выход из системы | Нажать кнопку logout в header | Сессия очищается, пользователь возвращается на экран входа | Pass |
| TC-37 | Frontend | Блокировка защищенного маршрута | Открыть защищенный маршрут без сессии | Пользователь перенаправляется на логин | Pass |

## 6. Известные ограничения тестирования
На текущем этапе существуют следующие ограничения:

- автоматические unit-тесты отсутствуют;
- автоматические integration-тесты отсутствуют;
- frontend-бизнес-модули еще не реализованы полностью;
- аналитический интерфейс недоступен для полного пользовательского тестирования;
- отчет в основном основан на ручной проверке и логике уже реализованных маршрутов.

## 7. Вывод
На текущем этапе разработки основная backend-функциональность и доступный frontend-сценарий авторизации можно считать протестированными на ручном уровне.

Проект уже демонстрирует:
- рабочую логику аутентификации;
- ролевую защиту;
- функциональные backend-модули клиентов, склада, шаблонов букетов и заказов;
- рабочий frontend-прототип для входа и защищенной маршрутизации.

Дальнейшее тестирование должно включать автоматические тесты и полноценные end-to-end проверки после завершения frontend-модулей.
