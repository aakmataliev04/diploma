# Smart Flora / Flora CRM

## English
`Smart Flora / Flora CRM` is a diploma project focused on developing a web-oriented CRM and POS system for a retail flower shop.
The main business idea of the project is to help a small flower business **increase sales and profit** by:
- speeding up employee workflows;
- reducing inventory mistakes and stock losses;
- supporting repeat sales through customer management and loyalty logic;
- creating a foundation for analytics and better management decisions.

The project is based on the concept:
**"Technology that does not interfere with creativity."**

At the current stage, the repository contains:
- a working backend foundation;
- authentication and role-based access logic;
- inventory, client, bouquet template, and order modules on the backend;
- a frontend prototype with login, protected routes, and role-based navigation.

## Project Structure
- `backend` - REST API, business logic, Prisma ORM, PostgreSQL integration
- `CRM-proj` - React frontend client for employees

## Technology Stack
- `Node.js`
- `TypeScript`
- `Express`
- `Prisma`
- `PostgreSQL`
- `React 19`
- `Vite`
- `Axios`

## Current Status
Current status of the project:
- `Development / Prototype stage`

Already available:
- backend build;
- frontend build;
- authentication flow;
- role-based route separation.

Still under development:
- complete POS workflow on the frontend;
- full CRUD screens on the frontend;
- analytics dashboard;
- automated tests.

## Run Locally
### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd CRM-proj
npm install
npm run dev
```

Backend environment variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` optional, default `5001`

Frontend environment variable:
- `VITE_API_BASE_URL` optional, default `http://localhost:5001/api`

## Documentation
- [Developer Documentation](/Users/atabekakmataliev/Desktop/diploma/DEVELOPER_DOCUMENTATION.md)
- [User Documentation](/Users/atabekakmataliev/Desktop/diploma/USER_DOCUMENTATION.md)

---

## Русский
`Smart Flora / Flora CRM` — это дипломный проект по разработке веб-ориентированной CRM- и POS-системы для розничного цветочного магазина.
Главная бизнес-идея проекта — помочь малому цветочному бизнесу **увеличивать продажи и прибыль** за счет:
- ускорения работы сотрудников;
- снижения ошибок складского учета и товарных потерь;
- поддержки повторных продаж через клиентскую базу и логику лояльности;
- подготовки основы для аналитики и более точных управленческих решений.

Проект строится на концепции:
**«Технологии, которые не мешают творчеству».**

На текущем этапе в репозитории уже находятся:
- рабочая серверная основа;
- логика авторизации и разграничения ролей;
- backend-модули склада, клиентов, шаблонов букетов и заказов;
- frontend-прототип с логином, защищенными маршрутами и ролевой навигацией.

## Структура проекта
- `backend` — REST API, бизнес-логика, Prisma ORM, интеграция с PostgreSQL
- `CRM-proj` — React frontend для сотрудников

## Технологический стек
- `Node.js`
- `TypeScript`
- `Express`
- `Prisma`
- `PostgreSQL`
- `React 19`
- `Vite`
- `Axios`

## Текущий статус
Текущее состояние проекта:
- `Этап разработки / прототип`

Уже доступно:
- сборка backend;
- сборка frontend;
- сценарий авторизации;
- ролевое разделение маршрутов.

Еще в разработке:
- полноценный POS-процесс на frontend;
- полные CRUD-экраны на frontend;
- аналитический дашборд;
- автоматические тесты.

## Локальный запуск
### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd CRM-proj
npm install
npm run dev
```

Переменные окружения для backend:
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT` — опционально, по умолчанию `5001`

Переменная окружения для frontend:
- `VITE_API_BASE_URL` — опционально, по умолчанию `http://localhost:5001/api`

## Документация
- [Developer Documentation](/Users/atabekakmataliev/Desktop/diploma/DEVELOPER_DOCUMENTATION.md)
- [User Documentation](/Users/atabekakmataliev/Desktop/diploma/USER_DOCUMENTATION.md)
