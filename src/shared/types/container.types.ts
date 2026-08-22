export const TYPES = {
  DataSource: Symbol.for("DataSource"),

  AuthController: Symbol.for("AuthController"),
  AuthService: Symbol.for("AuthService"),
  AuthRepository: Symbol.for("AuthRepository"),
  AuthRouter: Symbol.for("AuthRouter"),

  TransactionManager: Symbol.for("TransactionManager"),

  NotificationService: Symbol.for("NotificationService"),
  NotificationController: Symbol.for("NotificationController"),
  NotificationRepository: Symbol.for("NotificationRepository"),
  NotificationRouter: Symbol.for("NotificationRouter"),

  VerifyOtpRepository: Symbol.for("VerifyOtpRepository"),

  UserSubscriptionRepository: Symbol.for("UserSubscriptionRepository"),

  UserService: Symbol.for("UserService"),
  UserController: Symbol.for("UserController"),
  UserRepository: Symbol.for("UserRepository"),
  UserRouter: Symbol.for("UserRouter"),

  TenantService: Symbol.for("TenantService"),
  TenantController: Symbol.for("TenantController"),
  TenantRepository: Symbol.for("TenantRepository"),
  TenantRouter: Symbol.for("TenantRouter"),

  // TODO: In store module, move to store types
  RoleService: Symbol.for("RoleService"),
  RoleController: Symbol.for("RoleController"),
  RoleRepository: Symbol.for("RoleRepository"),
  RoleRouter: Symbol.for("RoleRouter"),

  EmployeeService: Symbol.for("EmployeeService"),
  EmployeeController: Symbol.for("EmployeeController"),
  EmployeeRepository: Symbol.for("EmployeeRepository"),
  EmployeeRouter: Symbol.for("EmployeeRouter"),

  TenantUserService: Symbol.for("TenantUserService"),
  TenantUserController: Symbol.for("TenantUserController"),
  TenantUserRouter: Symbol.for("TenantUserRouter"),
  TenantUserRepository: Symbol.for("TenantUserRepository"),
};
