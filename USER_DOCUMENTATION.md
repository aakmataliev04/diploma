# User Documentation: Smart Flora / Flora CRM

## English Version

## 1. Introduction

`Smart Flora / Flora CRM` is a specialized CRM and POS-oriented system for flower shop business automation.

The main idea of the project is to help a small flower business increase sales and profit by:

- making employee workflows faster;
- reducing inventory mistakes;
- supporting repeat sales through customer management;
- creating a foundation for analytics and loyalty logic.

This document describes the **current user-facing version** of the system available in the `diploma` project at the present development stage.

Important note: the current frontend version is still a prototype. At this stage, the fully working user interface is mainly limited to the authentication flow, role-based navigation, and the shell of future modules.

## 2. Intended Users

The system is designed for two user roles:

- `ADMIN`
- `FLORIST`

### `ADMIN`

The administrator role is intended for the owner, manager, or responsible staff member who needs access to management sections of the system.

### `FLORIST`

The florist role is intended for employees who work directly with orders and daily store operations.

## 3. Purpose of the Current Frontend Version

At the current project stage, the frontend application is used to:

- sign in to the system;
- separate access by role;
- display available navigation sections for each role;
- provide the base interface structure for further module development.

This means the current user version should be treated as a **working prototype**, not as a fully completed production interface.

## 4. Accessing the System

After launching the frontend application, the user is taken to the login screen.

The login screen allows the user to:

- choose a role;
- enter a PIN code;
- sign in to the system.

The login UI currently includes:

- role selection between `FLORIST` and `ADMIN`;
- PIN indicators;
- numeric keypad;
- reset and delete actions;
- login button.

## 5. Authentication Process

Authentication is based on PIN codes and backend token validation.

### Sign-in steps

1. Open the application.
2. Select the required role.
3. Enter the PIN code.
4. Press the sign-in button.
5. Wait for the system to validate the PIN.

If the PIN is correct:

- the system authenticates the employee;
- a JWT token is received from the backend;
- the session is stored in the browser;
- the user is redirected to the route corresponding to the selected role.

If the PIN is incorrect:

- the system displays an error message;
- the user remains on the login screen.

## 6. Role-Based Navigation

After successful authentication, the user is redirected according to their role.

### Admin route group

The administrator is redirected to the admin section and can see navigation items for:

- POS terminal;
- client database;
- bouquet constructor;
- inventory;
- analytics.

### Florist route group

The florist is redirected to the florist section and can see navigation items for:

- POS terminal;
- client search;
- bouquet constructor;
- inventory.

Important note: in the current project version, these routes mostly represent the structure of future work modules. Some of them are not yet implemented as full working pages and may appear as placeholder screens.

## 7. Current User Features

At the present development stage, the user can reliably interact with the following frontend features:

- open the application;
- choose a role;
- enter a PIN code using the on-screen keypad;
- sign in if valid credentials exist in the backend;
- stay authenticated using stored session data;
- navigate through role-based routes;
- log out from the header.

## 8. Current Limitations

The user should be aware of the following limitations in the current version:

- the frontend is not yet a complete business interface;
- many work sections are currently placeholders;
- the full POS workflow is not yet implemented in the visible UI;
- the analytics dashboard is not yet implemented;
- full CRUD interaction for clients, inventory, bouquets, and orders is still under development on the frontend side.

Because of this, the current user documentation describes the **prototype behavior** of the system rather than the final behavior of the finished diploma project.

## 9. Expected Future User Capabilities

According to the target project concept, future versions of the system are expected to allow users to:

- create and manage orders through a POS interface;
- work with inventory items and bouquet templates;
- manage client information and events;
- analyze sales by traffic source;
- use the system for operational and marketing decisions.

These capabilities are part of the planned system architecture, but not all of them are available in the current frontend implementation.

## 10. Basic User Guidance

For the current version of the system, the recommended user workflow is:

1. Start the frontend application.
2. Select the correct role.
3. Enter the PIN code.
4. Sign in.
5. Review the available role-based sections.
6. Use the interface as a demonstration prototype of the future CRM/POS structure.

## 11. Conclusion

The current user-facing version of `Smart Flora / Flora CRM` should be viewed as an early working interface for a diploma project.

At this stage, the main completed user scenario is authentication and role-based access. The remaining sections already exist as part of the system structure and demonstrate how the finished CRM will be organized in later development stages.

---

## Русская версия

## 1. Введение

`Smart Flora / Flora CRM` — это специализированная CRM- и POS-ориентированная система для автоматизации цветочного бизнеса.

Главная идея проекта заключается в том, чтобы помочь малому цветочному бизнесу увеличивать продажи и прибыль за счет:

- ускорения работы сотрудников;
- снижения ошибок складского учета;
- поддержки повторных продаж через клиентскую базу;
- подготовки основы для аналитики и логики лояльности.

Этот документ описывает **текущую пользовательскую версию** системы, доступную в проекте `diploma` на данном этапе разработки.

Важно: текущая версия frontend пока является прототипом. На этом этапе полностью рабочая пользовательская часть в основном ограничивается авторизацией, ролевой навигацией и каркасом будущих модулей.

## 2. Для кого предназначена система

Система рассчитана на две роли:

- `ADMIN`
- `FLORIST`

### `ADMIN`

Роль администратора предназначена для владельца, управляющего или ответственного сотрудника, которому нужен доступ к управленческим разделам системы.

### `FLORIST`

Роль флориста предназначена для сотрудников, которые работают непосредственно с заказами и ежедневными операциями магазина.

## 3. Назначение текущей версии frontend

На текущем этапе frontend-приложение используется для того, чтобы:

- входить в систему;
- разграничивать доступ по ролям;
- показывать доступные разделы для каждой роли;
- предоставлять базовую структуру интерфейса для дальнейшей разработки модулей.

Это означает, что текущую пользовательскую версию следует рассматривать как **рабочий прототип**, а не как полностью завершенный производственный интерфейс.

## 4. Вход в систему

После запуска frontend-приложения пользователь попадает на экран входа.

Экран входа позволяет:

- выбрать роль;
- ввести PIN-код;
- выполнить вход в систему.

В текущем интерфейсе экрана входа есть:

- переключение ролей между `FLORIST` и `ADMIN`;
- индикаторы ввода PIN;
- цифровая клавиатура;
- кнопки сброса и удаления;
- кнопка входа.

## 5. Процесс авторизации

Авторизация построена на PIN-кодах и проверке backend-токена.

### Шаги входа

1. Открыть приложение.
2. Выбрать нужную роль.
3. Ввести PIN-код.
4. Нажать кнопку входа.
5. Дождаться проверки PIN системой.

Если PIN введен правильно:

- система аутентифицирует сотрудника;
- frontend получает JWT-токен от backend;
- сессия сохраняется в браузере;
- пользователь перенаправляется на маршрут, соответствующий его роли.

Если PIN неверный:

- система показывает сообщение об ошибке;
- пользователь остается на экране входа.

## 6. Ролевая навигация

После успешной авторизации пользователь перенаправляется в раздел, соответствующий его роли.

### Группа маршрутов администратора

Администратор перенаправляется в административную часть и видит пункты навигации:

- POS-терминал;
- клиентская база;
- конструктор букетов;
- склад;
- аналитика.

### Группа маршрутов флориста

Флорист перенаправляется в свою рабочую часть и видит пункты навигации:

- POS-терминал;
- поиск клиентов;
- конструктор букетов;
- склад.

Важно: в текущей версии проекта эти маршруты в основном представляют структуру будущих рабочих модулей. Некоторые из них пока не реализованы как полноценные рабочие страницы и могут отображаться как placeholder-экраны.

## 7. Текущие пользовательские возможности

На текущем этапе разработки пользователь может надежно использовать следующие frontend-возможности:

- открыть приложение;
- выбрать роль;
- ввести PIN-код через экранную клавиатуру;
- войти в систему при наличии корректных данных в backend;
- сохранять авторизацию за счет сохраненной сессии;
- переходить по маршрутам, доступным его роли;
- выходить из системы через header.

## 8. Текущие ограничения

Пользователь должен учитывать следующие ограничения текущей версии:

- frontend пока не является полноценным рабочим бизнес-интерфейсом;
- многие рабочие разделы пока представлены заглушками;
- полный POS-процесс пока не реализован во видимом интерфейсе;
- аналитический дашборд пока не реализован;
- полноценная CRUD-работа с клиентами, складом, букетами и заказами на frontend еще находится в разработке.

Поэтому данная пользовательская документация описывает **поведение прототипа**, а не окончательное поведение завершенной версии дипломного проекта.

## 9. Ожидаемые возможности в будущих версиях

Согласно целевой концепции проекта, будущие версии системы должны позволять пользователю:

- создавать и оформлять заказы через POS-интерфейс;
- работать со складскими позициями и шаблонами букетов;
- управлять клиентской базой и событиями клиентов;
- анализировать продажи по источникам трафика;
- использовать систему для операционных и маркетинговых решений.

Эти возможности заложены в архитектуру проекта, но в текущей версии frontend реализованы не полностью.

## 10. Базовая инструкция пользователя

Для текущей версии системы рекомендуемый сценарий работы пользователя следующий:

1. Запустить frontend-приложение.
2. Выбрать правильную роль.
3. Ввести PIN-код.
4. Выполнить вход.
5. Ознакомиться с разделами, доступными для своей роли.
6. Использовать интерфейс как демонстрационный прототип будущей CRM/POS-системы.

## 11. Вывод

Текущую пользовательскую версию `Smart Flora / Flora CRM` следует рассматривать как ранний рабочий интерфейс дипломного проекта.

На данном этапе основным завершенным пользовательским сценарием является авторизация и доступ по ролям. Остальные разделы уже присутствуют в структуре системы и показывают, как будет организована готовая CRM в следующих этапах разработки.
