## MODIFIED Requirements

### Requirement: Product endpoints

The system SHALL expose role-protected (`@Roles('ADMIN')`) endpoints to create, edit, activate, deactivate, list (paginated, name search, category/status filters), and fetch products, delegating to the domain use cases and mapping domain failures to HTTP status codes.

#### Scenario: Create product

- **WHEN** an ADMIN POSTs a valid product with at least one variation to `POST /api/products`
- **THEN** the response is 201 with the created product (RF-CAT-01, RF-CAT-02)

#### Scenario: Duplicate SKU mapped to 409

- **WHEN** a create/edit returns `SKU_ALREADY_IN_USE`
- **THEN** the endpoint responds 409 Conflict (RF-CAT-04)

#### Scenario: Product without variation mapped to 422

- **WHEN** a create returns `PRODUCT_MUST_HAVE_VARIATION`
- **THEN** the endpoint responds 422 Unprocessable Entity (RF-CAT-02)

#### Scenario: Unknown category mapped to 404

- **WHEN** a create/edit returns `CATEGORY_NOT_FOUND`
- **THEN** the endpoint responds 404 Not Found (RN03)

#### Scenario: Inactive category mapped to 422

- **WHEN** a create/edit returns `CATEGORY_INACTIVE`
- **THEN** the endpoint responds 422 Unprocessable Entity (RN02)

#### Scenario: Invalid price mapped to 422

- **WHEN** a create/edit returns `INVALID_PRICE`
- **THEN** the endpoint responds 422 Unprocessable Entity (RN08)

#### Scenario: Paginated, filtered listing

- **WHEN** `GET /api/products?page=1&pageSize=20&name=...&categoryId=...&active=true` is called
- **THEN** a paginated payload of matching products is returned (RF-CAT-08)
