<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Blog-Andev 

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Sử dụng](#-sử-dụng)
- [API Documentation](#-api-documentation)
- [Workflow](#-workflow)
- [Deployment](#-deployment)
- [Đóng góp](#-đóng-góp)
- [License](#-license)

## ✨ Tính năng

### 🔐 Xác thực & Phân quyền

### 📧 Email Service

### 👥 User Management

## 🏗️ Kiến trúc hệ thống
- **Framework**: NestJS 11.x
- **Language**: TypeScript 5.8.x
- **Database**: PostgreSQL với Prisma ORM
- **Authentication**: Passport.js + JWT
- **Package Manager**: pnpm
- **Code Quality**: Biome (linting & formatting)
- **Testing**: Jest

### Module Structure
src/
├── modules/
│   ├── 
│   ├── 
│   ├── 
│   ├── 
│   └── 
│   └── 
├── 
├── 
├── 
├── 
├── prisma/             # Database service
```
## 💻 Yêu cầu hệ thống

- **Node.js**: 23.x hoặc cao hơn
- **PostgreSQL**: 14.x hoặc cao hơn
- **pnpm**: 10.x hoặc cao hơn

## Project setup

```bash
$ pnpm install
```

## Install
```bash
git clone <repository-url>
cd folder
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```
### Install Dependencies
```bash

pnpm install

or

npm install
```

### Config Enviroment
```bash

cp .env.example .env

./download-envs.sh
```
###  Config database
```bash

pnpm run db:push

pnpm prisma migrate dev
```
## ⚙️ Cấu hình

### Environment Variables

### Database Schema

Dự án sử dụng Prisma với PostgreSQL. Các schema chính:

- **User**: Thông tin người dùng
- **Ticket**: Support tickets
- **Post**: Posts
- **Comment**: Comments
- **Database**: Database hosting

## 🎯 Sử dụng

### Scripts có sẵn
```bash
# Development
pnpm run start:dev          # Chạy với hot reload
pnpm run start:debug        # Chạy với debug mode

# Production
pnpm run build              # Build ứng dụng
pnpm run start:prod         # Chạy production

# Database
pnpm run db:push            # Push schema lên database
pnpm prisma studio          # Mở Prisma Studio

# Code Quality
pnpm run lint               # Kiểm tra code style
pnpm run lint:fix           # Tự động fix code style
pnpm run format             # Format code
pnpm run typecheck          # Kiểm tra TypeScript

# Testing
pnpm run test               # Chạy unit tests
pnpm run test:watch         # Chạy tests với watch mode
pnpm run test:e2e           # Chạy end-to-end tests
pnpm run test:cov           # Chạy tests với coverage

# Git Hooks
pnpm run commit             # Commit với conventional commits
```

## 📞 Support

- **Email**: thaianthedev@gmail.com
- **Issues**: Tạo issue trên GitHub
- **Documentation**: Xem thêm trong `/docs` folder