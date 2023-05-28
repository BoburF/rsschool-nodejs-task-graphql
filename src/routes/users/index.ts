import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { idParamSchema } from "../../utils/reusedSchemas";
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from "./schemas";
import type { UserEntity } from "../../utils/DB/entities/DBUsers";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get("/", async function (request, reply): Promise<UserEntity[]> {
    const users = await fastify.db.users.findMany();

    return reply.send(users);
  });

  fastify.get(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({
        key: "id",
        equals: request.params.id,
      });
      if (!user) throw reply.code(404);
      return reply.send(user);
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.create(request.body);
      return reply.send(user);
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.delete(request.params.id);
      const membertype = await fastify.db.profiles.findOne({
        key: "userId",
        equals: request.params.id,
      });
      const post = await fastify.db.posts.findOne({
        key: "userId",
        equals: request.params.id,
      });
      const profile = await fastify.db.profiles.findOne({
        key: "userId",
        equals: request.params.id,
      });
      await fastify.db.memberTypes.delete(membertype?.id || "");
      await fastify.db.posts.delete(post?.id || "");
      await fastify.db.profiles.delete(profile?.id || "");
      return reply.send(user);
    }
  );

  fastify.post(
    "/:id/subscribeTo",
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({
        key: "id",
        equals: request.params.id,
      });
      user?.subscribedToUserIds.push(request.body.userId);
      await fastify.db.users.change(request.params.id, {
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        subscribedToUserIds: user?.subscribedToUserIds,
      });
      return reply.send(user);
    }
  );

  fastify.post(
    "/:id/unsubscribeFrom",
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({
        key: "id",
        equals: request.params.id,
      });
      const idx = user?.subscribedToUserIds.indexOf(request.body.userId);
      if (typeof idx === "number") {
        user?.subscribedToUserIds.splice(idx, 1);
      }
      await fastify.db.users.change(request.params.id, {
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        subscribedToUserIds: user?.subscribedToUserIds,
      });
      return reply.send(user);
    }
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return reply.send(
        await fastify.db.users.change(request.params.id, request.body)
      );
    }
  );
};

export default plugin;
