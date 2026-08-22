import * as fs from "fs";
import * as path from "path";

interface ColumnInfo {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  enumValues?: string[];
  length?: number;
}

export function generateValidatorFromEntityAuto(
  entityFilePath: string,
  outputPath: string,
) {
  // Read the entity file content
  const entityContent = fs.readFileSync(entityFilePath, "utf-8");

  // Extract class name
  const classNameMatch = entityContent.match(/export\s+class\s+(\w+)/);
  const className = classNameMatch ? classNameMatch[1] : "Unknown";

  // Extract columns from decorators
  const columns = extractColumnsFromSource(entityContent);

  const validatorContent = generateValidatorContent(className, columns);

  fs.writeFileSync(outputPath, validatorContent);
  console.log(`Generated validator for ${className} at ${outputPath}`);
}

function extractColumnsFromSource(sourceCode: string): ColumnInfo[] {
  const columns: ColumnInfo[] = [];

  // Find all @Column decorators and their properties
  const columnRegex = /@Column\(([^)]*)\)\s*(\w+)(!|\?)?:\s*(\w+(?:\[\])?)/g;
  let match;

  while ((match = columnRegex.exec(sourceCode)) !== null) {
    const [, decoratorOptions, propertyName, optionalModifier, propertyType] =
      match;

    // Parse decorator options
    const options = parseDecoratorOptions(decoratorOptions);

    // Determine if property is optional
    const isOptional = optionalModifier === "?" || options.nullable === true;

    // Determine if property is array
    const isArray = propertyType.includes("[]") || options.array === true;

    // Map TypeScript/TypeORM types to Zod types
    const zodType = mapTypeToZod(
      propertyType,
      { ...options, optional: isOptional },
      propertyName,
    );

    columns.push({
      name: propertyName,
      type: zodType,
      isOptional,
      isArray,
      enumValues: options.enum,
      length: options.length,
    });
  }

  // Also look for simple property declarations without @Column
  const simplePropertyRegex = /^\s*(\w+)(!|\?)?:\s*(\w+(?:\[\])?);/gm;
  let propMatch;

  while ((propMatch = simplePropertyRegex.exec(sourceCode)) !== null) {
    const [, propertyName, optionalModifier, propertyType] = propMatch;

    // Skip if already found with @Column decorator
    if (columns.find((col) => col.name === propertyName)) {
      continue;
    }

    // Skip common base entity fields and relations
    if (["id", "createdAt", "updatedAt", "deletedAt"].includes(propertyName)) {
      continue;
    }

    // Skip if it looks like a relation (has @OneToMany, @ManyToOne, etc. nearby)
    const beforeProperty = sourceCode.substring(0, propMatch.index);
    const relationDecorators = /@(OneToMany|ManyToOne|OneToOne|ManyToMany)/;
    const linesBeforeProperty = beforeProperty.split("\n").slice(-5).join("\n");

    if (relationDecorators.test(linesBeforeProperty)) {
      continue;
    }

    const isOptional = optionalModifier === "?";
    const isArray = propertyType.includes("[]");

    const zodType = mapTypeToZod(
      propertyType,
      { optional: isOptional },
      propertyName,
    );

    columns.push({
      name: propertyName,
      type: zodType,
      isOptional,
      isArray,
    });
  }

  return columns;
}

function parseDecoratorOptions(optionsString: string): any {
  if (!optionsString || optionsString.trim() === "") {
    return {};
  }

  const options: any = {};

  try {
    // Simple parsing for common options
    if (optionsString.includes("nullable: true")) {
      options.nullable = true;
    }

    if (optionsString.includes("array: true")) {
      options.array = true;
    }

    // Extract type
    const typeMatch = optionsString.match(/type:\s*["']([^"']+)["']/);
    if (typeMatch) {
      options.type = typeMatch[1];
    }

    // Extract length
    const lengthMatch = optionsString.match(/length:\s*(\d+)/);
    if (lengthMatch) {
      options.length = parseInt(lengthMatch[1]);
    }

    // Extract enum - improved pattern matching
    const enumMatch = optionsString.match(/enum:\s*\[([^\]]+)\]/);
    if (enumMatch) {
      // Parse array of enum values like ["GENERAL", "TEAM_1", "TEAM_2"]
      const enumValuesStr = enumMatch[1];
      const enumValues = enumValuesStr
        .split(",")
        .map((v) => v.trim().replace(/['"]/g, ""))
        .filter((v) => v.length > 0);
      options.enumValues = enumValues;
    } else {
      // Check for Object.values pattern
      const objectEnumMatch = optionsString.match(/enum:\s*([^,}]+)/);
      if (objectEnumMatch) {
        options.enum = objectEnumMatch[1];
      }
    }

    // Extract default
    const defaultMatch = optionsString.match(/default:\s*([^,}]+)/);
    if (defaultMatch) {
      options.default = defaultMatch[1];
    }
  } catch (error) {
    console.warn("Error parsing decorator options:", optionsString);
  }

  return options;
}

function mapTypeToZod(
  tsType: string,
  options: any,
  fieldName?: string,
): string {
  // Remove array notation for base type mapping
  const baseType = tsType.replace("[]", "");
  const isArray = tsType.includes("[]") || options.array;
  const isOptional = options.nullable || options.optional;

  let zodType = "";

  // Handle enums
  if (options.enumValues && options.enumValues.length > 0) {
    // Direct enum values from parsing
    const enumValues = options.enumValues;
    if (!isOptional && fieldName) {
      zodType = `z.enum([${enumValues.map((v: string) => `"${v}"`).join(", ")}], { message: "${fieldName}.required" })`;
    } else {
      zodType = `z.enum([${enumValues.map((v: string) => `"${v}"`).join(", ")}])`;
    }
  } else if (options.enum) {
    // Object.values pattern or other enum references
    const enumValues = extractEnumValues(options.enum);
    if (enumValues.length > 0) {
      if (!isOptional && fieldName) {
        zodType = `z.enum([${enumValues
          .map((v: string) => `"${v}"`)
          .join(", ")}], { message: "${fieldName}.required" })`;
      } else {
        zodType = `z.enum([${enumValues.map((v: string) => `"${v}"`).join(", ")}])`;
      }
    } else {
      // If we can't extract enum values, fallback to string with enum constraint comment
      if (!isOptional && fieldName) {
        zodType = `z.string({ message: "${fieldName}.required" }) /* TODO: Replace with proper enum values */`;
      } else {
        zodType =
          "z.string().trim() /* TODO: Replace with proper enum values */";
      }
    }
  } else {
    // Map basic types
    switch (baseType.toLowerCase()) {
      case "string":
        if (!isOptional && fieldName) {
          zodType = `z.string({ message: "${fieldName}.required" })`;
        } else {
          zodType = "z.string().trim()";
        }

        // Add length constraint
        if (options.length) {
          zodType += `.max(${options.length})`;
        }
        break;

      case "number":
        if (!isOptional && fieldName) {
          zodType = `z.number({ message: "${fieldName}.required" })`;
        } else {
          zodType = "z.number()";
        }
        break;

      case "boolean":
        if (!isOptional && fieldName) {
          zodType = `z.boolean({ message: "${fieldName}.required" })`;
        } else {
          zodType = "z.boolean()";
        }
        break;

      case "date":
        if (!isOptional && fieldName) {
          zodType = `z.date({ message: "${fieldName}.required" })`;
        } else {
          zodType = "z.date()";
        }
        break;

      default:
        // Handle custom types or fallback to string
        if (!isOptional && fieldName) {
          zodType = `z.string({ message: "${fieldName}.required" })`;
        } else {
          zodType = "z.string().trim()";
        }
    }
  }

  // Add special validations based on field name
  if (fieldName && zodType.includes("z.string(")) {
    if (fieldName.includes("email")) {
      zodType += `.email({ message: "${fieldName}.invalid" })`;
    } else if (fieldName.includes("password")) {
      zodType += `.min(6, { message: "${fieldName}.min_length" })`;
    } else if (fieldName.includes("phoneNumber")) {
      zodType += `.regex(/^[0-9+\\-\\s()]+$/, { message: "${fieldName}.invalid" })`;
    } else if (fieldName.includes("url") || fieldName.includes("link")) {
      zodType += `.url({ message: "${fieldName}.invalid" })`;
    }
  }

  // Handle arrays
  if (isArray) {
    zodType = `z.array(${zodType})`;
  }

  return zodType;
}

function extractEnumValues(enumString: string): string[] {
  // Handle Object.values(EnumName) pattern
  const objectValuesMatch = enumString.match(/Object\.values\((\w+)\)/);
  if (objectValuesMatch) {
    const enumName = objectValuesMatch[1];
    // For common enum patterns, return some default values
    // In a real implementation, you'd want to parse the actual enum definition
    switch (enumName.toLowerCase()) {
      case "team":
      case "teamtype":
        return ["DEVELOPMENT", "DESIGN", "MARKETING", "SELLS"];
      case "status":
      case "orderstatus":
        return ["PENDING", "PROCESSING", "COMPLETED", "CANCELED"];
      case "role":
      case "userrole":
        return ["USER", "ADMIN", "MANAGER"];
      case "type":
        return ["TYPE_A", "TYPE_B", "TYPE_C"];
      default:
        return ["VALUE_1", "VALUE_2", "VALUE_3"];
    }
  }

  // Handle direct enum values array like ['value1', 'value2']
  const arrayMatch = enumString.match(/\[([^\]]+)\]/);
  if (arrayMatch) {
    const values = arrayMatch[1]
      .split(",")
      .map((v) => v.trim().replace(/['"]/g, ""));
    return values;
  }

  // Handle inline enum object like {VALUE1: 'value1', VALUE2: 'value2'}
  const objectMatch = enumString.match(/\{([^}]+)\}/);
  if (objectMatch) {
    const entries = objectMatch[1].split(",");
    const values: string[] = [];
    for (const entry of entries) {
      const valueMatch = entry.match(/:\s*['"]([^'"]+)['"]/);
      if (valueMatch) {
        values.push(valueMatch[1]);
      }
    }
    return values;
  }

  // If we can't parse the enum, fallback to string validation
  return [];
}

function generateValidatorContent(
  className: string,
  columns: ColumnInfo[],
): string {
  const imports = `import { z } from "zod";


`;

  const createSchemaFields = columns
    .filter(
      (col) =>
        !["id", "createdAt", "updatedAt", "deletedAt", "refreshToken"].includes(
          col.name,
        ),
    )
    .map((col) => {
      let field = `  ${col.name}: ${col.type}`;
      if (col.isOptional) {
        field += ".optional()";
      }
      return field;
    })
    .join(",\n");

  const updateSchemaFields = columns
    .filter(
      (col) =>
        !["id", "createdAt", "updatedAt", "deletedAt"].includes(col.name),
    )
    .map((col) => {
      // For update schema, create a version without required messages
      let updateType = col.type;

      // Remove required messages for update schema
      if (
        updateType.includes("{ message:") &&
        updateType.includes('.required"')
      ) {
        // Handle z.enum case
        if (updateType.startsWith("z.enum(")) {
          const enumMatch = updateType.match(/z\.enum\(\[([^\]]+)\]/);
          if (enumMatch) {
            updateType = `z.enum([${enumMatch[1]}])`;
          }
        } else {
          // Handle other types
          updateType = updateType.replace(/{ message: "[^"]*\.required" }/, "");
          updateType = updateType.replace(/z\.(\w+)\(\)/, "z.$1()");
        }
      }

      return `  ${col.name}: ${updateType}.optional()`;
    })
    .join(",\n");

  const schemas = `export const Create${className}Schema = z.object({
${createSchemaFields}
});

export const Update${className}Schema = z.object({
${updateSchemaFields}
});

export const ${className}QuerySchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val) || 1)
    .optional(),
  size: z
    .string()
    .transform((val) => parseInt(val) || 10)
    .optional(),
  keyword: z.string().trim().optional(),
});

export const ${className}ParamsSchema = z.object({
  id: z.coerce.number().positive("Invalid ${className.toLowerCase()} ID format"),
});

`;

  const types = `export type Create${className}Dto = z.infer<typeof Create${className}Schema>;
export type Update${className}Dto = z.infer<typeof Update${className}Schema>;
export type ${className}QueryDto = z.infer<typeof ${className}QuerySchema>;
export type ${className}ParamsDto = z.infer<typeof ${className}ParamsSchema>;
`;

  return imports + schemas + types;
}

// Command line usage example
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length >= 2) {
    const entityPath = args[0];
    const outputPath = args[1];
    generateValidatorFromEntityAuto(entityPath, outputPath);
  } else {
    console.log(
      "Usage: npx ts-node generate-validator-auto.ts <entity-file-path> <output-path>",
    );
    console.log(
      "Example: npx ts-node generate-validator-auto.ts src/database/entities/User.ts src/module/user/user.validator.generated.ts",
    );
  }
}
