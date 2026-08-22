export const DATABASE_SCHEMA = `
=== DATABASE SCHEMA ===

## Users
- id, name, code, email, username, phoneNumber, avatar, isActive
- role (ADMIN/USER), employeeType (INTERN/PROBATION/OFFICIAL)
- Relations: permissionGroup, jobPosition, tasks[], projects (as leader)

## Projects
- id, name, code, contractNumber, contractDate
- startDate, plannedEndDate, actualEndDate
- status (pending/completed/completed_late/overdue/canceled)
- Relations: leader (User), tasks[], features[]

## Features
- id, name, code, description
- Relations: project, tasks[], testCases[]

## Tasks
- id, name, code, description
- startDate, plannedEndDate, endDate
- plannedHours, actualHours, reworkedHours, revisionCount
- status (pending/completed/completed_late/overdue/canceled)
- Relations: user, project, feature, jobPosition, workingHistories[]

## WorkingHistories
- id, workingDate, workingHours
- isDone (approved), isRevision
- Relations: user, task, project

## TestCases
- id, name, code, description, preconditions, steps, expectedResult
- priority (LOW/MEDIUM/HIGH/CRITICAL)
- status (PENDING/PASSED/FAILED/FIXING/WAITING/CANCELED)
- Relations: feature, testHistories[]

## TestHistories
- id, testDate, actualResult, result (PASSED/FAILED/BLOCKED/SKIPPED)
- bugStatus (PENDING/FIXED/CANCELED), fixedDate
- Relations: testCase, tester (User), assignee (User)

## Timekeepings
- id, date, start, end
- Relations: user

## Comments
- id, content, createdAt
- Relations: user, task

## PermissionGroups
- id, name, permissions (JSON)

## Attributes (JobPositions/TaskGroups)
- id, name, type (JOB_POSITION/TASK_GROUP)
`;

export const AI_CONTEXT = `
=== SYSTEM CONTEXT ===

Bạn là AI Assistant cho hệ thống quản lý dự án PMi của công ty Itomo.

CHỨC NĂNG CHÍNH:
1. Quản lý dự án, tính năng, task
2. Quản lý user, phân quyền, chức vụ
3. Chấm công (timekeeping)
4. Lịch sử làm việc (working histories)
5. Test case và quản lý bug
6. Báo cáo và thống kê

NGUYÊN TẮC TRẢ LỜI:
- Trả lời bằng tiếng Việt, chuyên nghiệp
- Trích dẫn dữ liệu cụ thể từ database
- Giải thích rõ ràng, có ví dụ minh họa
- Đề xuất action items khi cần

${DATABASE_SCHEMA}
`;

export const getContextForQuery = (query: string): string => {
  let context = AI_CONTEXT;

  // Dynamic context based on query
  if (query.includes('task') || query.includes('công việc')) {
    context += `\n\n=== TASK DETAILS ===
Status meanings:
- pending: Đang làm
- completed: Hoàn thành đúng hạn
- completed_late: Hoàn thành trễ
- overdue: Quá hạn chưa hoàn thành
- canceled: Đã hủy
`;
  }

  if (query.includes('test') || query.includes('bug')) {
    context += `\n\n=== TESTING DETAILS ===
TestCase Status:
- PENDING: Chưa test
- PASSED: Đạt
- FAILED: Lỗi
- FIXING: Đang sửa
- WAITING: Chờ test lại
`;
  }

  return context;
};
