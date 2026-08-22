import {
  BaseRepository,
  IFindPaginationOptions,
} from "@/shared/base/BaseRepository";
import { EmployeeSelectFull, EmployeeRelations } from "./employee.select";
import { Employee } from "@/database/models/store/Employee";
import { SelectQueryBuilder } from "typeorm";
import { EmployeeSnapshot } from "./employee.types";

export class EmployeeRepository extends BaseRepository<Employee> {
  protected entityClass = Employee;
  protected selectedFields = EmployeeSelectFull;
  protected relations = EmployeeRelations;

  findByEmail(email: string): Promise<Employee | null> {
    return this.findOne({
      where: { email },
    });
  }

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<Employee>,
    options: IFindPaginationOptions<Employee>,
  ): Promise<void> {
    super.extendQueryBuilder?.(qb, options);
    if (options?.moreQuery?.storeId) {
      qb.andWhere(`${qb.alias}.storeId = :storeId`, {
        storeId: options.moreQuery.storeId,
      });
    }
  }
  async getEmployeeSnapshot(
    employeeId: string,
  ): Promise<EmployeeSnapshot | null> {
    const employee = await this.findById(employeeId);

    if (!employee) return null;

    return {
      id: employee.id,
      name: employee.name,
      code: employee.code,
      email: employee.email,
      phone: employee.phone,
      identityNumber: employee.identityNumber,
      position: employee.position
        ? {
            id: employee.position.id,
            name: employee.position.name,
          }
        : null,
    };
  }
}
