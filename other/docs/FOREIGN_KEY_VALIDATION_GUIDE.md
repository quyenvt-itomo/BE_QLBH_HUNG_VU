// ===============================================
// FOREIGN KEY VALIDATION METHODS IN BASE SERVICE
// ===============================================

/\*
BaseService cung cấp 3 phương thức để validate foreign keys:

1. validateForeignKey() - Validate một foreign key với repository tương ứng
2. validateMultipleForeignKeys() - Validate nhiều foreign keys cùng lúc
3. validateForeignKeyRelations() - Validate relations trong object (legacy)

\*/

// ===============================================
// 1. VALIDATE SINGLE FOREIGN KEY
// ===============================================

/\*
validateForeignKey<E>(
foreignKeyValue: number | number[] | null | undefined,
repository: BaseRepository<E>,
fieldName: string,
errors: string[] = []
): Promise<{ data: E | E[] | null; errors: string[] }>

- foreignKeyValue: Giá trị foreign key cần validate (có thể là số, mảng số, null, undefined)
- repository: Repository của entity được reference
- fieldName: Tên field để hiển thị trong error message
- errors: Mảng errors (optional)

Returns: Object chứa data tìm được và mảng errors
Throws: NotFoundError nếu có lỗi validation
\*/

// EXAMPLE USAGE:
export class ProductService extends BaseService<Product> {
async createProduct(data: CreateProductDto): Promise<ApiResponse<Product>> {
// Validate single foreign key
const { data: store } = await this.validateForeignKey(
data.storeId,
this.storeRepository,
'store'
);

    // Validate array of foreign keys
    const { data: attributeDetails } = await this.validateForeignKey(
      data.detailIds, // [1, 2, 3]
      this.attributeDetailRepository,
      'attributeDetails'
    );

    // Create product with validated data
    const product = await this.productRepository.create({
      ...data,
      store,
      details: attributeDetails
    });

    return ApiResponseHandler.createSuccess("Product created", product);

}
}

// ===============================================
// 2. VALIDATE MULTIPLE FOREIGN KEYS
// ===============================================

/\*
validateMultipleForeignKeys(
validations: Array<{
value: number | number[] | null | undefined;
repository: BaseRepository<any>;
fieldName: string;
}>
): Promise<{ data: Record<string, any>; errors: string[] }>

- validations: Mảng các validation configs
- Returns: Object chứa tất cả data validated và mảng errors
- Throws: NotFoundError nếu có bất kỳ validation nào fail
  \*/

// EXAMPLE USAGE:
export class OrderService extends BaseService<Order> {
async createOrder(data: CreateOrderDto): Promise<ApiResponse<Order>> {
// Validate multiple foreign keys cùng lúc
const { data: validatedData } = await this.validateMultipleForeignKeys([
{
value: data.customerId,
repository: this.customerRepository,
fieldName: 'customer'
},
{
value: data.productIds, // [1, 2, 3]
repository: this.productRepository,
fieldName: 'products'
},
{
value: data.storeId,
repository: this.storeRepository,
fieldName: 'store'
}
]);

    // validatedData sẽ chứa:
    // {
    //   customer: Customer entity,
    //   products: Product[] entities,
    //   store: Store entity
    // }

    const order = await this.orderRepository.create({
      ...data,
      customer: validatedData.customer,
      products: validatedData.products,
      store: validatedData.store
    });

    return ApiResponseHandler.createSuccess("Order created", order);

}
}

// ===============================================
// 3. ERROR HANDLING
// ===============================================

/\*
Khi validation fail, NotFoundError sẽ được throw với:

- message: "Foreign key validation failed" hoặc "Multiple foreign key validation failed"
- errors: Mảng các error messages chi tiết

Error message format:

- Single ID not found: "fieldName.not_found: 123"
- Multiple IDs not found: "fieldName.not_found: [1, 2, 3]"
- Invalid type: "fieldName.invalid_type"
  \*/

// EXAMPLE ERROR HANDLING:
export class UserService extends BaseService<User> {
async assignRoles(userId: number, roleIds: number[]): Promise<ApiResponse<User>> {
try {
const { data: validatedData } = await this.validateMultipleForeignKeys([
{
value: userId,
repository: this.userRepository,
fieldName: 'user'
},
{
value: roleIds,
repository: this.roleRepository,
fieldName: 'roles'
}
]);

      // Process with validated data...

    } catch (error) {
      if (error instanceof NotFoundError) {
        // error.errors sẽ chứa:
        // ["user.not_found: 123", "roles.not_found: [4, 5]"]
        console.log('Validation errors:', error.errors);
      }
      throw error;
    }

}
}

// ===============================================
// 4. BEST PRACTICES
// ===============================================

/\*

1. Luôn validate foreign keys trước khi tạo/cập nhật entities
2. Sử dụng validateMultipleForeignKeys() khi có nhiều foreign keys
3. Handle NotFoundError appropriately trong controller/service
4. Sử dụng transaction khi tạo entities với relations
5. Cache validated entities để tránh query lại database
   \*/

export class ProductService extends BaseService<Product> {
async createProductWithDetails(data: CreateProductDto): Promise<ApiResponse<Product>> {
return await this.transactionManager.withTransaction(async (tx) => {
// Step 1: Validate all foreign keys
const { data: validatedData } = await this.validateMultipleForeignKeys([
{
value: data.storeId,
repository: this.storeRepository,
fieldName: 'store'
},
{
value: data.categoryId,
repository: this.categoryRepository,
fieldName: 'category'
},
{
value: data.attributeDetailIds,
repository: this.attributeDetailRepository,
fieldName: 'attributeDetails'
}
]);

      // Step 2: Create main entity
      const product = await this.productRepository.create({
        name: data.name,
        code: data.code,
        price: data.price,
        store: validatedData.store,
        category: validatedData.category
      }, tx.manager);

      // Step 3: Set relations
      product.details = validatedData.attributeDetails;
      await tx.manager.save(product);

      return ApiResponseHandler.createSuccess("Product created successfully", product);
    });

}
}
