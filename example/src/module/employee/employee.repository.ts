import { BaseRepository } from "@/shared/base/BaseRepository";
import { Employee, EmployeeSnapshot } from "@/database/models/company/Employee";
import { EmployeeRelations, EmployeeSelectFull } from "./employee.select";
import { DeepPartial, EntityManager } from "typeorm";

export class EmployeeRepository extends BaseRepository<Employee> {
  protected entityClass = Employee;
  protected selectedFields = EmployeeSelectFull;
  protected relations = EmployeeRelations;
  protected nestedFileFields?: string[] | undefined = ["contracts"];

  async getSnapshot(
    id?: string | null,
    manager?: EntityManager,
  ): Promise<EmployeeSnapshot | null> {
    if (!id) return null;
    const employee = await this.findById(id, manager);
    if (!employee) return null;
    return {
      id: employee.id,
      code: employee.code,
      name: employee.name,
      gender: employee.gender,
      dob: employee.dob,
      storeId: employee.storeId,
    };
  }

  /**
   * Tự động gán snapshot cho tất cả các trường employee-* có trong data.
   * Chỉ gọi getSnapshot khi id thay đổi (khác với snapshot hiện tại).
   * Khi có thêm entity mới cần snapshot employee mới, chỉ cần thêm cặp field vào đây.
   */
  async attachInfo<
    T extends {
      requesterId?: string | null;
      requesterSnapshot?: DeepPartial<EmployeeSnapshot> | null;
      approverId?: string | null;
      approverSnapshot?: DeepPartial<EmployeeSnapshot> | null;
      employeeId?: string | null;
      employeeSnapshot?: DeepPartial<EmployeeSnapshot> | null;
      assignedByAccountId?: string | null;
      assignedByAccountSnapshot?: DeepPartial<EmployeeSnapshot> | null;
      staffId?: string | null;
      staffSnapshot?: DeepPartial<EmployeeSnapshot> | null;
      confirmerId?: string | null;
      confirmerSnapshot?: DeepPartial<EmployeeSnapshot> | null;
    },
  >(data: T, manager?: EntityManager): Promise<void> {
    // requesterId → requesterSnapshot
    if (
      data.requesterId &&
      (!data.requesterSnapshot ||
        data.requesterSnapshot.id !== data.requesterId)
    )
      data.requesterSnapshot = await this.getSnapshot(
        data.requesterId,
        manager,
      );

    // approverId → approverSnapshot
    if (
      data.approverId &&
      (!data.approverSnapshot || data.approverSnapshot.id !== data.approverId)
    )
      data.approverSnapshot = await this.getSnapshot(data.approverId, manager);

    // employeeId → employeeSnapshot
    if (
      data.employeeId &&
      (!data.employeeSnapshot || data.employeeSnapshot.id !== data.employeeId)
    )
      data.employeeSnapshot = await this.getSnapshot(data.employeeId, manager);

    // assignedByAccountId → assignedByAccountSnapshot
    if (
      data.assignedByAccountId &&
      (!data.assignedByAccountSnapshot ||
        data.assignedByAccountSnapshot.id !== data.assignedByAccountId)
    )
      data.assignedByAccountSnapshot = await this.getSnapshot(
        data.assignedByAccountId,
        manager,
      );

    // staffId → staffSnapshot
    if (
      data.staffId &&
      (!data.staffSnapshot || data.staffSnapshot.id !== data.staffId)
    )
      data.staffSnapshot = await this.getSnapshot(data.staffId, manager);

    // confirmerId → confirmerSnapshot
    if (
      data.confirmerId &&
      (!data.confirmerSnapshot ||
        data.confirmerSnapshot.id !== data.confirmerId)
    )
      data.confirmerSnapshot = await this.getSnapshot(
        data.confirmerId,
        manager,
      );
  }
}
