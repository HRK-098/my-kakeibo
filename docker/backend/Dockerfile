FROM maven:3-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copy Maven file for dependancy caching
COPY backend/.mvn .mvn
COPY backend/mvnw backend/pom.xml ./

# Download dependencies (cached layer)
RUN --mount=type=cache,target=/root/.m2 \
  mvn dependency:go-offline -B

# Copy source code
COPY backend/src ./src

# Build the Backend application
RUN --mount=type=cache,target=/root/.m2 \
  mvn clean package -DskipTests -B

# Runtime stage - JRE for running Backend
# FROM eclipse-temurin:21-alpine3.23-dev AS runtime
FROM eclipse-temurin:21-jre-alpine AS runtime

# Create non-root user for security
RUN addgroup -g 1001 appgroup && \
  adduser -u 1001 -G appgroup -s /bin/sh -D appuser

WORKDIR /app

# Copy the build JAR from build stage
COPY --from=build /app/target/kakeibo-backend-*.jar app.jar

# Change ownership to appuser user
RUN chown appuser:appgroup app.jar

USER appuser

# Backend runs on port 8080 by default
EXPOSE 8080

ENTRYPOINT [ "java", "-jar", "app.jar" ]
