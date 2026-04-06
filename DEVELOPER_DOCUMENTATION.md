# Developer Documentation: Smart Flora / Flora CRM
## English Version
## 1. Project Overview
**Diploma project topic:** development of a web-oriented CRM and POS system for automating the business processes of a retail flower shop.

The current version of the `diploma` repository represents a specialized CRM solution for the floral business focused not only on process automation, but also on **increasing sales and profit for small businesses**.

The core idea of the project is that the CRM system should help the shop:
- process sales faster;
- reduce warehouse losses;
- retain repeat customers;
- increase average order value through convenient order composition and service logic;
- provide the owner with data for marketing and purchasing decisions.

The concept of the system can be expressed as:
**"Technology that does not interfere with creativity."**

The interface and the business logic are designed so that the florist spends as little time as possible on technical actions and can focus on bouquet creation and customer interaction.

## 2. System Purpose
`Smart Flora` is designed to automate the key operations of a flower shop:
- employee sign-in;
- inventory and product management;
- customer database management;
- POS order creation;
- loyalty logic application;
- bouquet structure storage and ingredient deduction;
- sales and traffic source analysis.

The system is designed for two user roles:

- `ADMIN` - store owner, manager, or administrator;
- `FLORIST` - florist or cashier working with orders and inventory.

## 3. Business Idea

Unlike general-purpose POS systems, `Smart Flora` is designed specifically for the floral business and considers:

- perishable goods;
- the need for fast customer service;
- frequent repeat purchases;
- the emotional relationship between florist and customer;
- composite orders where the total price is formed by both materials and design/service work.

The main business value of the system is:

- increasing service speed;
- reducing stock deduction mistakes;
- controlling order profitability;
- growing repeat sales through loyalty logic;
- reducing losses caused by ineffective purchasing.

Therefore, `Smart Flora` is positioned as a tool for **sales growth, profit growth, and operational sustainability for small businesses**.

## 4. Technology Stack

### Backend

- `Node.js`
- `TypeScript`
- `Express`
- `Prisma ORM`
- `PostgreSQL`
- `@prisma/adapter-pg`
- `JWT`
- `bcryptjs`
- `nodemon`

### Frontend

- `React 19`
- `TypeScript`
- `Vite`
- `React Router`
- `Axios`

## 5. Repository Structure

```text
diploma/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── middlewares/
│   │   │   └── authMiddleware.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── clients.ts
│   │   │   ├── inventory.ts
│   │   │   └── orders.ts
│   │   ├── db.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── CRM-proj/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── containers/
│   │   ├── App.tsx
│   │   ├── axiosApi.ts
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── DEVELOPER_DOCUMENTATION.md
```

The project is divided into two major parts:

- `backend` - REST API, business logic, and database access;
- `CRM-proj` - client application for employees.

## 6. Solution Architecture

The project follows a classic `client-server` architecture.

### Frontend responsibilities

- rendering the application interface;
- routing and role-based navigation;
- user authentication state;
- session persistence;
- communication with the backend API.

### Backend responsibilities

- access validation;
- business logic processing;
- operations with orders, clients, inventory, and bouquet templates;
- interaction with PostgreSQL through Prisma;
- returning JSON responses to the frontend.

### Database responsibilities

The database stores:

- employees;
- clients;
- client events;
- inventory items;
- bouquet templates;
- bouquet ingredients;
- orders;
- order entries.

## 7. Current Project State

The current repository reflects the **new working version of the diploma project**, where the server foundation and the basic frontend shell are already implemented.

### Already implemented in code

- JWT authentication and role model;
- employee registration with role restrictions;
- client search and creation;
- inventory operations;
- bouquet template operations;
- order creation;
- stock deduction logic;
- loyalty discount logic for repeat orders;
- frontend authentication;
- protected routing;
- role-based interface separation for `ADMIN` and `FLORIST`.

### Implemented partially or still under development

- full frontend CRUD screens;
- complete POS screen and cashier workflow;
- analytics module;
- reports and data visualization;
- automated tests.

Important note: the current frontend already contains roles, navigation, login flow, and the shell for future work modules, but some screens are still represented by placeholder components and serve as a base for further development.

## 8. Module Structure

### 8.1 Security and Authorization Module (Smart PIN)

**Purpose:** fast and secure employee access to the system.

Considering the retail environment, the system prioritizes fast sign-in by PIN code instead of the classic login/password combination.

### Current implementation

Files:

- [backend/src/routes/auth.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/routes/auth.ts)
- [backend/src/middlewares/authMiddleware.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/middlewares/authMiddleware.ts)
- [CRM-proj/src/app/AuthContext.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/app/AuthContext.tsx)
- [CRM-proj/src/containers/Login/Login.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/containers/Login/Login.tsx)

### Implemented features

- PIN-based sign-in;
- JWT token generation;
- token verification middleware;
- role-based access restrictions;
- bootstrap logic for the first user;
- `bcrypt` hashing for PIN values.

### Role model

- `ADMIN` - access to administrative and management functionality;
- `FLORIST` - access to day-to-day cashier and limited inventory functions.

### Available endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### 8.2 Inventory Module

**Purpose:** management of store products and bouquet templates.

The inventory subsystem helps the shop track real stock, control cost price, and avoid losses caused by incorrect stock deduction.

### Current implementation

File:

- [backend/src/routes/inventory.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/routes/inventory.ts)

### Implemented features

- create inventory items;
- fetch active items;
- update item data;
- add stock quantity;
- archive items with soft delete;
- create bouquet templates;
- store bouquet ingredients;
- update bouquet templates;
- archive bouquet templates.

### Inventory item structure

- name;
- category;
- image;
- quantity;
- cost price;
- sale price;
- active flag.

### Note on the updated project concept

The conceptual design of the project includes support for `SERVICE`-type categories for virtual services that affect order profitability. In the current backend version, such a category can already be stored as a regular string value in the `category` field, but dedicated infinite-stock logic for service items is not yet explicitly implemented in code.

### Available endpoints

- `POST /api/inventory`
- `GET /api/inventory`
- `PUT /api/inventory/:id`
- `PATCH /api/inventory/:id/add-stock`
- `DELETE /api/inventory/:id`
- `POST /api/inventory/templates`
- `GET /api/inventory/templates`
- `PUT /api/inventory/templates/:id`
- `DELETE /api/inventory/templates/:id`

### 8.3 Clients Module

**Purpose:** storing customer data and building a client base for repeat sales and marketing.

For a small business, the client database is one of the main sources of revenue growth because it supports repeat purchases and loyalty logic.

### Current implementation

File:

- [backend/src/routes/clients.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/routes/clients.ts)

### Implemented features

- client search by phone number;
- getting the client list;
- creating a new client;
- adding client events.

### Business logic

- both florist and admin can search clients by phone;
- the full client database is available only to admin;
- events such as birthdays and anniversaries can be attached to a client profile.

### Available endpoints

- `GET /api/clients/search?phone=...`
- `GET /api/clients`
- `POST /api/clients`
- `POST /api/clients/:id/events`

### 8.4 Orders and Loyalty Module (POS & Orders)

**Purpose:** sales processing and data consistency protection.

This is the core module of the project because it directly affects business monetization.

### Current implementation

File:

- [backend/src/routes/orders.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/routes/orders.ts)

### Implemented features

- order creation;
- combined work with individual items and bouquet templates in one order;
- automatic client creation or update by phone number;
- incrementing the client order counter;
- saving a client event during order creation;
- stock deduction for direct items;
- ingredient deduction for bouquet template sales;
- repeat-client discount calculation;
- protection against negative final totals.

### Loyalty logic

The current implementation uses the following rule:

- if the client order count is divisible by `7`, the system calculates the average cost of previous orders and applies it as a discount;
- the final order amount can never become negative.

### Architectural detail

Order creation is executed inside a Prisma transaction, which is important for consistency during:

- client creation or update;
- stock deduction;
- creation of the order and its nested entries.

### Available endpoint

- `POST /api/orders`

### 8.5 Frontend Client Module

**Purpose:** visual shell for employee interaction with the system.

### Current implementation

Key files:

- [CRM-proj/src/App.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/App.tsx)
- [CRM-proj/src/main.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/main.tsx)
- [CRM-proj/src/components/layout/Layout.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/components/layout/Layout.tsx)
- [CRM-proj/src/components/Header/Header.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/components/Header/Header.tsx)
- [CRM-proj/src/app/navigation.ts](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/app/navigation.ts)
- [CRM-proj/src/axiosApi.ts](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/axiosApi.ts)

### Implemented features

- login screen;
- role selection during sign-in;
- session storage in `localStorage`;
- automatic JWT insertion into the `Authorization` header;
- protected routes;
- separate routes for `ADMIN` and `FLORIST`;
- header navigation for work sections.

### Note on the target concept

The future version of the project includes a full `POS` interface with split-screen layout:

- left area - product catalog with search and filters;
- right area - cart and client details.

In the current repository version, this idea is represented at the routing and module-structure level, while the full cashier screen and complete CRUD pages are still under development.

### 8.6 Analytics and Forecasting Module

**Purpose:** help the owner make decisions about marketing, purchasing, and profitability.

### Target role of the module

The analytics module is intended to:

- show sales by traffic sources;
- analyze the effectiveness of acquisition channels;
- identify popular inventory items;
- support purchase forecasting;
- reduce losses from perishable goods.

### Current state in the project

At the moment, the analytics section exists in the admin frontend navigation, but the full analytics module and its visualizations are not yet implemented.

## 9. Data Model

The database schema is defined in [backend/prisma/schema.prisma](/Users/atabekakmataliev/Desktop/diploma/backend/prisma/schema.prisma).

### Main models

- `User`
- `Client`
- `ClientEvent`
- `Item`
- `BouquetTemplate`
- `BouquetIngredient`
- `Order`
- `OrderItem`
- `OrderBouquet`

### Entity relationships

- one `Client` can have many `Order`;
- one `Client` can have many `ClientEvent`;
- one `Order` can contain many `OrderItem`;
- one `Order` can contain many `OrderBouquet`;
- one `BouquetTemplate` can contain many `BouquetIngredient`;
- one `Item` can be used both as a direct-sale product and as a bouquet ingredient.

### Data design decisions

- `Item` and `BouquetTemplate` use soft delete through `isActive`;
- `priceAtSale` is stored in order entries for historical correctness;
- bouquet structure is normalized through a dedicated ingredient table;
- `ordersCount` in `Client` is used by the loyalty logic.

## 10. Environment Variables

### Backend

Required variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` - optional, default is `5001`

Files using environment variables:

- [backend/src/index.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/index.ts)
- [backend/src/db.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/db.ts)
- [backend/prisma.config.ts](/Users/atabekakmataliev/Desktop/diploma/backend/prisma.config.ts)

### Frontend

Optional variable:

- `VITE_API_BASE_URL`

By default the frontend calls:

`http://localhost:5001/api`

Configuration file:

- [CRM-proj/src/axiosApi.ts](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/axiosApi.ts)

## 11. Local Run Instructions

### 11.1 Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend`:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
PORT=5001
```

Run backend in development mode:

```bash
npm run dev
```

Build backend:

```bash
npm run build
```

Run the production build:

```bash
npm run start
```

### 11.2 Frontend

```bash
cd CRM-proj
npm install
```

Optional `.env`:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

Run in development mode:

```bash
npm run dev
```

Build frontend:

```bash
npm run build
```

## 12. Verification Status

For the current repository state, the following has been confirmed:

- backend builds successfully with `npm run build`;
- frontend builds successfully with `npm run build`;
- the repository contains Git history reflecting the project development stages.

## 13. Current Limitations

At the time of writing, the project has the following limitations:

- some frontend modules are still placeholders;
- the analytics module has not yet been implemented;
- automated unit and integration tests are not present yet;
- Swagger/OpenAPI documentation has not been added yet;
- several frontend lint issues still require cleanup.

## 14. Further Development Directions

To complete the project and strengthen its practical value, it is recommended to:

- implement the full POS screen;
- add working CRUD interfaces on the frontend;
- introduce service-item business logic;
- implement analytics charts and dashboards;
- add automated tests;
- prepare seed data for demonstrations;
- prepare user documentation and test reports.

## 15. Conclusion

The current version of `Smart Flora / Flora CRM` already contains the working server-side foundation of the diploma project and a basic client application.

The project addresses an important practical problem for small businesses: it helps not only to keep records, but also to **increase sales and profit** through:

- faster employee workflows;
- inventory and cost control;
- repeat-sales support;
- order automation;
- groundwork for analytics and marketing decisions.

Thus, the project can be considered a specialized digital platform for a flower shop focused on efficiency, revenue growth, and better customer service.

---

## Русская версия

## 1. Общая информация о проекте

**Тема дипломного проекта:** разработка веб-ориентированной CRM- и POS-системы для автоматизации бизнес-процессов розничного цветочного магазина.

Текущая версия проекта в репозитории `diploma` представляет собой специализированную CRM-систему для цветочного бизнеса, ориентированную не только на автоматизацию внутренних операций, но и на **увеличение продаж и прибыли малого бизнеса**.

Ключевая идея проекта заключается в том, что CRM должна помогать магазину:

- быстрее оформлять продажи;
- уменьшать потери на складе;
- удерживать постоянных клиентов;
- повышать средний чек за счет удобной сборки заказов и услуг;
- давать владельцу магазина данные для принятия решений по закупкам и маркетингу.

Концепция системы формулируется как:

**«Технологии, которые не мешают творчеству»**.

Интерфейс и логика системы проектируются так, чтобы флорист тратил минимум времени на технические действия и мог сосредоточиться на сборке букета и работе с клиентом.

## 2. Назначение системы

`Smart Flora` предназначена для автоматизации ключевых процессов цветочного магазина:

- вход сотрудников в систему;
- управление товарами и складом;
- ведение клиентской базы;
- оформление заказов на кассе;
- применение логики лояльности;
- хранение структуры букетов и списание ингредиентов;
- анализ продаж и каналов привлечения клиентов.

Система ориентирована на два типа пользователей:

- `ADMIN` — владелец, управляющий или администратор магазина;
- `FLORIST` — флорист или кассир, работающий с заказами и складом.

## 3. Бизнес-идея проекта

В отличие от универсальных POS-систем, `Smart Flora` проектируется с учетом особенностей цветочного бизнеса:

- скоропортящийся товар;
- необходимость быстрого обслуживания;
- частые повторные покупки;
- важность эмоциональной связи с клиентом;
- комбинированные заказы, где итоговая стоимость складывается из материалов и услуги оформления.

Основная бизнес-ценность системы:

- повышение скорости обслуживания клиентов;
- снижение ошибок при списании товара;
- контроль маржинальности заказов;
- рост повторных продаж через систему лояльности;
- снижение финансовых потерь от неэффективных закупок.

Таким образом, `Smart Flora` рассматривается как инструмент **роста продаж, прибыли и операционной устойчивости малого бизнеса**.

## 4. Технологический стек

### Серверная часть

- `Node.js`
- `TypeScript`
- `Express`
- `Prisma ORM`
- `PostgreSQL`
- `@prisma/adapter-pg`
- `JWT`
- `bcryptjs`
- `nodemon`

### Клиентская часть

- `React 19`
- `TypeScript`
- `Vite`
- `React Router`
- `Axios`

## 5. Структура репозитория

```text
diploma/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── middlewares/
│   │   │   └── authMiddleware.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── clients.ts
│   │   │   ├── inventory.ts
│   │   │   └── orders.ts
│   │   ├── db.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── CRM-proj/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── containers/
│   │   ├── App.tsx
│   │   ├── axiosApi.ts
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── DEVELOPER_DOCUMENTATION.md
```

Проект разделен на две независимые части:

- `backend` — REST API, бизнес-логика и доступ к базе данных;
- `CRM-proj` — клиентское приложение для сотрудников.

## 6. Архитектура решения

Проект использует классическую архитектуру `client-server`.

### Frontend

Клиентская часть отвечает за:

- отображение интерфейса системы;
- маршрутизацию и разграничение экранов по ролям;
- авторизацию пользователя;
- хранение пользовательской сессии;
- отправку запросов к backend API.

### Backend

Серверная часть отвечает за:

- проверку доступа;
- обработку бизнес-логики;
- операции с заказами, клиентами, товарами и шаблонами букетов;
- взаимодействие с PostgreSQL через Prisma;
- выдачу JSON-ответов клиентской части.

### Database

База данных хранит:

- сотрудников;
- клиентов;
- события клиентов;
- складские позиции;
- шаблоны букетов;
- составы букетов;
- заказы;
- элементы заказа.

## 7. Актуальное состояние проекта

Текущий репозиторий отражает **новую рабочую версию проекта diploma**, в которой уже реализован серверный фундамент и базовый frontend-каркас.

### Уже реализовано в коде

- JWT-аутентификация и ролевая модель;
- регистрация сотрудников с ограничениями по ролям;
- поиск и создание клиентов;
- работа со складом;
- работа с шаблонами букетов;
- создание заказов;
- списание остатков со склада;
- логика скидки для повторных заказов;
- frontend-авторизация;
- защищенная маршрутизация;
- разделение интерфейса по ролям `ADMIN` и `FLORIST`.

### Реализовано частично или находится в стадии развития

- полноценные рабочие CRUD-экраны на frontend;
- POS-экран с полной кассовой логикой;
- модуль аналитики;
- отчеты и визуализация данных;
- автоматические тесты.

Важно: в текущем frontend уже присутствуют роли, навигация, логин и каркас рабочих модулей, однако часть экранов пока представлена в виде placeholder-компонентов и служит основой для последующей доработки.

## 8. Модульная структура проекта

### 8.1 Модуль безопасности и авторизации (Smart PIN)

**Назначение:** быстрый и безопасный доступ сотрудников к системе.

С учетом специфики розничной торговли в системе сделан упор на быстрый вход по PIN-коду вместо классической пары логин/пароль.

### Реализация в текущем проекте

Файлы:

- [backend/src/routes/auth.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/routes/auth.ts)
- [backend/src/middlewares/authMiddleware.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/middlewares/authMiddleware.ts)
- [CRM-proj/src/app/AuthContext.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/app/AuthContext.tsx)
- [CRM-proj/src/containers/Login/Login.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/containers/Login/Login.tsx)

### Реализованные возможности

- вход по PIN-коду;
- генерация JWT-токена;
- проверка токена в middleware;
- разграничение прав доступа по ролям;
- bootstrap-логика первого пользователя;
- хранение PIN в виде `bcrypt`-хэша.

### Ролевая модель

- `ADMIN` — доступ к административным и управленческим функциям;
- `FLORIST` — доступ к рабочим операциям оформления заказов и части складских функций.

### Доступные endpoint'ы

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### 8.2 Модуль складского учета (Inventory)

**Назначение:** управление товарами магазина и шаблонами букетов.

Складская подсистема нужна для того, чтобы магазин видел реальные остатки, контролировал себестоимость и избегал потерь из-за неправильного списания товара.

### Реализация в текущем проекте

Файл:

- [backend/src/routes/inventory.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/routes/inventory.ts)

### Реализованные возможности

- создание складской позиции;
- получение списка активных товаров;
- обновление данных товара;
- пополнение количества товара;
- архивация товара через soft delete;
- создание шаблонов букетов;
- хранение ингредиентов шаблона;
- обновление шаблона букета;
- архивация шаблона букета.

### Структура складской позиции

- название;
- категория;
- изображение;
- количество;
- закупочная цена;
- цена продажи;
- признак активности.

### Примечание по новой концепции проекта

В концептуальном описании проекта предусмотрена поддержка категорий вида `SERVICE` для учета виртуальных услуг, влияющих на маржинальность заказа. В текущей версии backend такая категория может храниться как обычное строковое значение поля `category`, однако специальная логика бесконечного остатка для сервисных позиций пока явно не реализована в коде.

### Доступные endpoint'ы

- `POST /api/inventory`
- `GET /api/inventory`
- `PUT /api/inventory/:id`
- `PATCH /api/inventory/:id/add-stock`
- `DELETE /api/inventory/:id`
- `POST /api/inventory/templates`
- `GET /api/inventory/templates`
- `PUT /api/inventory/templates/:id`
- `DELETE /api/inventory/templates/:id`

### 8.3 Модуль клиентской базы (Clients)

**Назначение:** фиксировать клиентов и накапливать базу для повторных продаж и маркетинга.

Для малого бизнеса клиентская база является одним из главных источников роста выручки, так как позволяет отслеживать повторные покупки и применять систему лояльности.

### Реализация в текущем проекте

Файл:

- [backend/src/routes/clients.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/routes/clients.ts)

### Реализованные возможности

- поиск клиента по номеру телефона;
- получение списка клиентов;
- создание нового клиента;
- добавление событий клиента.

### Бизнес-логика

- флорист и администратор могут искать клиента по телефону;
- полная клиентская база доступна только администратору;
- к профилю клиента можно привязывать события, например дни рождения или годовщины.

### Доступные endpoint'ы

- `GET /api/clients/search?phone=...`
- `GET /api/clients`
- `POST /api/clients`
- `POST /api/clients/:id/events`

### 8.4 Модуль заказов и лояльности (POS & Orders)

**Назначение:** оформление продаж и защита согласованности данных.

Это центральный модуль проекта, так как именно через него проходит монетизация бизнеса.

### Реализация в текущем проекте

Файл:

- [backend/src/routes/orders.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/routes/orders.ts)

### Реализованные возможности

- создание заказа;
- работа с товарами и шаблонами букетов в одном заказе;
- автоматическое создание или обновление клиента по номеру телефона;
- увеличение счетчика заказов клиента;
- сохранение события клиента при оформлении заказа;
- списание товаров со склада;
- списание ингредиентов при продаже шаблонного букета;
- расчет скидки для повторного клиента;
- защита от отрицательной итоговой суммы.

### Логика лояльности

В текущей реализации используется правило:

- если количество заказов клиента кратно `7`, система вычисляет среднюю стоимость предыдущих заказов и применяет ее как скидку;
- итоговая сумма не может стать ниже нуля.

### Архитектурная особенность

Создание заказа выполняется внутри транзакции Prisma, что важно для согласованности данных при:

- создании или обновлении клиента;
- списании остатков;
- создании заказа и его составных частей.

### Доступный endpoint

- `POST /api/orders`

### 8.5 Модуль пользовательского интерфейса (Frontend Client)

**Назначение:** визуальная оболочка для работы сотрудников с системой.

### Реализация в текущем проекте

Основные файлы:

- [CRM-proj/src/App.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/App.tsx)
- [CRM-proj/src/main.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/main.tsx)
- [CRM-proj/src/components/layout/Layout.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/components/layout/Layout.tsx)
- [CRM-proj/src/components/Header/Header.tsx](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/components/Header/Header.tsx)
- [CRM-proj/src/app/navigation.ts](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/app/navigation.ts)
- [CRM-proj/src/axiosApi.ts](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/axiosApi.ts)

### Реализованные возможности

- экран логина;
- выбор роли при входе;
- хранение сессии в `localStorage`;
- автоматическая подстановка JWT в заголовок `Authorization`;
- защищенные маршруты;
- раздельные маршруты для `ADMIN` и `FLORIST`;
- header-навигация по рабочим разделам.

### Примечание по целевой концепции

В описании будущей версии проекта предусмотрен полноценный `POS`-интерфейс со split-screen компоновкой:

- левая зона — каталог товаров с поиском и фильтрами;
- правая зона — корзина и данные клиента.

В текущей версии репозитория эта идея пока отражена на уровне маршрутов и структуры будущих модулей. Полный кассовый экран и рабочие CRUD-страницы еще находятся в разработке.

### 8.6 Модуль аналитики и прогнозирования (Analytics & Marketing)

**Назначение:** помочь владельцу принимать решения по маркетингу, закупкам и управлению прибылью.

### Целевая роль модуля

Модуль аналитики должен:

- показывать продажи по источникам трафика;
- анализировать эффективность каналов привлечения;
- выявлять популярные позиции;
- помогать прогнозировать закупки;
- снижать потери от скоропортящегося товара.

### Текущее состояние в проекте

На текущий момент раздел аналитики присутствует в frontend-навигации администратора, однако полноценный аналитический модуль и визуализация данных еще не реализованы.

## 9. Модель данных

Схема базы данных описана в [backend/prisma/schema.prisma](/Users/atabekakmataliev/Desktop/diploma/backend/prisma/schema.prisma).

### Основные модели

- `User`
- `Client`
- `ClientEvent`
- `Item`
- `BouquetTemplate`
- `BouquetIngredient`
- `Order`
- `OrderItem`
- `OrderBouquet`

### Связи между сущностями

- один `Client` может иметь много `Order`;
- один `Client` может иметь много `ClientEvent`;
- один `Order` может содержать много `OrderItem`;
- один `Order` может содержать много `OrderBouquet`;
- один `BouquetTemplate` может содержать много `BouquetIngredient`;
- один `Item` может использоваться как самостоятельный товар и как ингредиент шаблона букета.

### Архитектурные решения по данным

- для `Item` и `BouquetTemplate` используется soft delete через поле `isActive`;
- для исторической корректности в заказах хранится `priceAtSale`;
- структура букета нормализована через отдельную таблицу ингредиентов;
- в `Client` хранится `ordersCount`, необходимый для логики лояльности.

## 10. Переменные окружения

### Backend

Обязательные переменные:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` — необязательная, по умолчанию используется `5001`

Файлы, где используются переменные окружения:

- [backend/src/index.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/index.ts)
- [backend/src/db.ts](/Users/atabekakmataliev/Desktop/diploma/backend/src/db.ts)
- [backend/prisma.config.ts](/Users/atabekakmataliev/Desktop/diploma/backend/prisma.config.ts)

### Frontend

Опциональная переменная:

- `VITE_API_BASE_URL`

По умолчанию frontend обращается к:

`http://localhost:5001/api`

Конфигурация находится в:

- [CRM-proj/src/axiosApi.ts](/Users/atabekakmataliev/Desktop/diploma/CRM-proj/src/axiosApi.ts)

## 11. Инструкция по локальному запуску

### 11.1 Backend

```bash
cd backend
npm install
```

Создать файл `.env` в папке `backend`:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
PORT=5001
```

Запуск backend в режиме разработки:

```bash
npm run dev
```

Сборка:

```bash
npm run build
```

Запуск production-сборки:

```bash
npm run start
```

### 11.2 Frontend

```bash
cd CRM-proj
npm install
```

При необходимости можно задать `.env`:

```env
VITE_API_BASE_URL=http://localhost:5001/api
```

Запуск в режиме разработки:

```bash
npm run dev
```

Сборка frontend:

```bash
npm run build
```

## 12. Проверка работоспособности

По текущему состоянию репозитория подтверждено следующее:

- backend успешно собирается через `npm run build`;
- frontend успешно собирается через `npm run build`;
- в репозитории присутствует история Git, отражающая этапы разработки проекта.

## 13. Текущие ограничения

На момент подготовки данной документации проект имеет следующие ограничения:

- часть frontend-модулей еще представлена заглушками;
- аналитический модуль пока не реализован;
- автоматические unit- и integration-тесты отсутствуют;
- документация API в формате Swagger/OpenAPI пока не добавлена;
- часть линтерных замечаний во frontend требует доработки.

## 14. Направления дальнейшего развития

Для завершения проекта и усиления практической ценности системы рекомендуется:

- реализовать полноценный POS-экран;
- добавить рабочие CRUD-интерфейсы на frontend;
- внедрить поддержку сервисных позиций с отдельной бизнес-логикой;
- реализовать аналитические графики и дашборды;
- добавить автоматические тесты;
- подготовить seed-данные для демонстрации;
- оформить пользовательскую документацию и тестовые отчеты.

## 15. Вывод

Текущая версия `Smart Flora / Flora CRM` уже содержит рабочий серверный фундамент дипломного проекта и базовую клиентскую часть.

Проект решает важную прикладную задачу малого бизнеса: помогает не просто вести учет, а **увеличивать продажи и прибыль** за счет:

- ускорения работы сотрудников;
- контроля склада и себестоимости;
- поддержки повторных продаж;
- автоматизации заказов;
- подготовки базы для аналитики и маркетинговых решений.

Таким образом, проект можно рассматривать как специализированную цифровую платформу для цветочного магазина, ориентированную на рост эффективности, выручки и качества обслуживания клиентов.
