# Library Management System

Library Management System is a modern web application designed to manage the core operations of a library in one digital workspace. It brings together book records, member records, circulation activity, and live operational updates inside a clean interface with an animated visual style.

## System Overview

The system is built to help librarians or administrators manage daily library tasks efficiently. It provides a central dashboard where users can view collection statistics, monitor active circulation, and work with books and members from a single interface.

The interface is designed with a polished glass-style theme, fade-based background visuals, and responsive layouts so the system feels professional on both desktop and mobile screens.

## Core Modules

### Catalog Management

The catalog module manages the book collection of the library. It allows administrators to maintain detailed records for each book, including title, author, category, edition details, description, and available copies.

This module supports:

- adding new books
- editing book details
- deleting books
- searching across the catalog
- tracking stock and availability

### Member Management

The member module keeps track of registered library users. Each member can be stored with details such as name, email, and department.

This module supports:

- adding new members
- deleting members
- searching members quickly
- organizing readers in a structured way

### Circulation Management

The circulation module handles book issue and return operations. It connects members with available books and updates stock automatically when a book is borrowed or returned.

This module supports:

- issuing books to members
- returning books
- updating available copies automatically
- preventing issue actions when no copy is available

### Activity History

The activity module records circulation events so the library can maintain an operational history. Instead of only showing the latest action, the system keeps the full saved activity timeline.

This module supports:

- viewing all saved activity
- filtering records by all events
- filtering borrow events only
- filtering return events only

## Data Handling

The system uses Firebase Firestore as the backend data store. Library data is organized into separate collections for books, members, and transactions. This structure helps keep the system modular, scalable, and easy to maintain.

Data is synchronized in real time, which means updates in the interface reflect the latest database state without requiring manual refresh logic.

## User Experience

The application focuses on clarity and speed for day-to-day use. Important actions such as adding a book, issuing a book, returning a book, or removing a member trigger visible popup notifications in the top-right corner, helping users understand what happened immediately.

The UI also emphasizes:

- modern dashboard presentation
- smooth transitions and animated background effects
- responsive design
- readable data cards and panels
- focused operational workflow

## Purpose

This system is intended to simplify library administration by reducing manual tracking and giving administrators a structured digital platform for handling books, members, and transactions.

It is suitable as a base system for academic libraries, institute libraries, training centers, or any organization that needs a simple and modern library workflow.
