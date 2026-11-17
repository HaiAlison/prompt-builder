Assignment – M2

Objective:

Design the architecture and implement a QR code-based Attendance and Access Control
System for a manufacturing company, adhering to SOLID principles, satisfying both functional
and non-functional requirements, and providing software architecture documentation from
multiple architectural views.

The project consists of two submission milestones (M1: focusing on requirements analysis and
software design; M2: finalizing the software design, implementing and testing the system).
Similar to a real-world software project, the project scope and requirements will be released
incrementally through separate documents; details of subsequent phases will be announced when
their respective milestones are reached.

Context:

TMC Manufacturing Joint Stock Company operates in the manufacturing sector and currently
owns two factories: Binh Duong (~800 employees) and Long An (~600 employees).

The company intends to develop a system to control employee access to the workplace while
also supporting the generation of monthly attendance reports.

The system uses QR codes for employee identification and attendance check-in/check-out. When
an employee passes through an access gate, a QR scanner triggers a signal to the turnstile
controller to unlock the gate. Each access event (entry or exit) is recorded as an attendance
transaction.

Integration: The company already has an existing HR/Payroll System. Attendance data must be
transmitted to this system through APIs and be available for reconciliation before 12:00 PM on
the first day of each month. The company also has an existing turnstile control system, which
exposes APIs for controlling gate opening and closing for each access event.

Users (Actors): employees, production supervisors, HR staff, security guards, system
administrators, and executive management (for reporting and monitoring purposes). Every
employee has a personal smartphone that can access the company’s mobile application, web
portal, or email system and display a QR code.

Out of scope for this phase: visitor management; payroll calculation (the system only exports
attendance data and does not perform payroll processing).

Scope of the System:

The key functional and non-functional requirements are listed below. Students may propose
additional requirements if deemed appropriate.

1. Functional Requirements

•  User and QR Code Management
•  Gate Station Management
•  Attendance Event Recording
•  Reporting and Auditing
•  System Administration

2. Non-Functional Requirements

•  Kiosk response time ≤ 2 seconds under the current workload conditions (peak shift
changes: approximately 800 access transactions within 30 minutes per factory).

•  No loss of attendance records during normal system operation.
•  Role-Based Access Control (RBAC) with comprehensive audit logging.
•  Protection of employees’ personal data in compliance with applicable data privacy

regulations.

Issues Encountered:

•  The system loses connectivity during attendance transaction processing.
•  Static QR codes may be exposed, creating opportunities for malicious actors to gain
unauthorized access to facilities or misuse the QR codes for fraudulent attendance
reporting.

→ Propose architectural enhancements or modifications to address the above issues. Clearly
explain how the proposed solution mitigates each issue and how it should be incorporated into
the system architecture.

Assignment Tasks:

Task 1: Software Architecture Design

1.  Thoroughly describe the context of the system based on the basic information provided.
This includes clearly identifying functional and non-functional requirements, outlining
the objectives and scope of the project, etc.

2.  Create the software architecture for the TMC: The software architecture should include:

o  Architecture Characteristics define the success criteria of the TMC.

o  Structure:

Ø  Compare and choose suitable architecture styles to apply to the TMC.

Ø  Present step by step how to create the logical and physical software

architecture of the system.

Ø  Present the software architecture in different views including module
views, component–and–connector views, and allocation views.

o  Architecture Decisions define the rules for how the TMC should be constructed.

o  Design Principles: Guidelines for constructing the TMC.

3.  Apply SOLID Principles: explain how the SOLID principles have been applied in your

design.

4.  Reflection Report: Write a brief reflection on how applying SOLID principles helped you
improve the design of the TMC. Discuss challenges you faced and how adhering to these
principles made your system more modular, maintainable, and extensible.

Task 2: Code Implementation (choose at least one main module to implement)

1.  Implement Core Functionalities: Implement key system features based on your design,

ensuring the code adheres to the SOLID principles.

Submission Instructions:

•  Submit a detailed report containing a GitHub URL (source code) on the LMS website.


