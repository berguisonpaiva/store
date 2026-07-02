## REMOVED Requirements

### Requirement: Registrar entrada de estoque (UI)

**Reason**: The mobile app is reduced to the Operador PDV surface; operators no longer register stock entries on mobile.

**Migration**: Perform stock entries on the web inventory surface (`web-inventory-movements`). The domain/data write contract (`RegisterEntry`) remains for potential reuse but is no longer exposed by a mobile screen.

### Requirement: Registrar saída manual (UI)

**Reason**: The mobile app is reduced to the Operador PDV surface; manual stock exits are not part of the operator workflow (stock only leaves via finalized sales).

**Migration**: Perform manual stock exits on the web inventory surface (`web-inventory-movements`). The domain/data write contract (`RegisterExit`) remains but is no longer exposed by a mobile screen.

### Requirement: Ajustar saldo (UI)

**Reason**: The mobile app is reduced to the Operador PDV surface; inventory corrections are an admin task, not an operator one.

**Migration**: Perform balance adjustments on the web inventory surface (`web-inventory-movements`). The domain/data write contract (`AdjustBalance`) remains but is no longer exposed by a mobile screen.

### Requirement: Dependency injection and routing for movements

**Reason**: With the entrada/saida/ajuste screens removed from mobile, their routes and cubit registrations are removed from the composition root.

**Migration**: No mobile routes are registered for stock movements; the movement flows live on the web inventory surface.
