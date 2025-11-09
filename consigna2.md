# BurgerTIC - Front End

Cada grupo debe elegir un `theme` para su tienda de hamburguesas. Algunos ejemplos pueden ser:

 * Low cost 
 * Premium
 * Asiatica
 * Americana
 * Vegana


## Consigna

Vamos a diseñar e implementar un **Front End** de una tienda de hamburguesas en `Javascript` y/o `TypeScrypt`, pudiendo usar tecnologias como `React` o `NextJS`.  
Los equipos pueden experimentar la tecnica `vibe coding` para el desarrollo  **NO SE VA A EVALUAR EL CODIGO GENERADO**

### Marca y Logo

Cada grupo deberá:
*	Definir un nombre y logo para la tienda.
*	Asegurarse de que el logo y la paleta de colores estén alineados con el tema elegido.
*	Incluir el logo en la interfaz del sistema (por ejemplo, en el encabezado o menú principal).


### UI

Es fundamental mantener coherencia visual entre el logo, los colores y los distintos componentes de la UI (botones, fondos, tipografías, etc.).

El proyecto debe incluir al menos:
*  Landing page de bienvenida que presente la tienda, su estilo, propuesta y tema elegido. 
*   Una pagina de login/registración
*	Una página principal con el listado de hamburguesas.
*	Un detalle de producto 
*   Un apartado `setup` para que el admin pueda acceder al CRUD de platos


### Funcionalidad
Se deben implementar TODAS las rutas del backend. Esto significa que se debe desarrollar la UI necesaria para que tanto los admin como los clientes se conecten al backend accediendo a las siguientes funciones:

Admin:
* Loguearse, registrarse
* Crear, modificar y eliminar platos
* Consultar platos por id, o por tipo
* Ver todos los platos
* Ver todos los pedidos
* Ver detalles de un pedido
* Cambiar estado de un pedido
* Eliminar un pedido

Cliente:
* Loguearse, registrarse
* Ver todos los platos filtrando opcionalmente por tipo
* Ver detalles de un plato
* Crear un pedido
* Ver sus pedidos


### Entrega

La fecha límite para subir el código es el día Viernes 14/11/2025, se descuentan puntos por no cumplir la fecha.  
En las clases siguientes iremos haciendo las demos de la aplicacion con el `back` y el `front` **funcionando y conectados entre si**.  

**Obs. 1**: Deben haber al menos 10 platos creados de distintos tipos y 2 pedidos.  
**Obs. 2**: El codigo debe cumplir con todos los lineamientos, librerias y estructuras que vimos en clase (guias en campus, tp4).  
**Obs. 3**: Para sumar puntos, agregar funcionalidad adicional o mejoras al codigo crudo generado por la IA.  

**importante** Completar el archivo log.md con el historial de los prompts ejecutados, respuestas obtenidas y acciones tomadas  


## Evaluacion
* Se va a pedir que se cree al menos 1 plato nuevo y 2 pedidos con distintos estados
* Cada integrante del equipo debe explicar que funcion cumplió que tareas realizó y su interaccion con la IA 
* Qué problemas tuvieron con el codigo generado por la IA, tuvieron que hacer modificaciones, pedir cambios, como los aplicaron?
* Explicar cómo se hace la conexion front-back desde ambos lados. Mostrar ejemplos
* Explicar cómo se aplican las foreign keys en sequelize
* Qué ventajas presenta sequelize a la hora de parsear datos de entrada y salida. Mostrar ejemplos
* Explicar cómo se probaron los endpoints
* Comprender la estructura del proyecto backend y responder preguntas **generales** sobre el código, por ejemplo: ¿ donde esta la funcion que valida cierta condicion ?
