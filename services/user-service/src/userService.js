import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export function createUserService(db) {
  return {
    async register({ name, email, password, role }) {
      const existingUser = await db("users").where({ email }).first();
      if (existingUser) {
        throw { code: "ALREADY_EXISTS", message: "Email đã tồn tại trong hệ thống" };
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const [newUser] = await db("users").insert({
        name,
        email,
        password_hash: passwordHash,
        role: role || "CUSTOMER"
      }).returning("*");

      const token = jwt.sign(
        { id: newUser.id, role: newUser.role },
        process.env.JWT_SECRET || "super_secret_jwt_key",
        { expiresIn: "7d" }
      );

      return {
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
      };
    },

    async login({ email, password }) {
      const user = await db("users").where({ email }).first();
      if (!user) {
        throw { code: "NOT_FOUND", message: "Email hoặc mật khẩu không chính xác" };
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw { code: "UNAUTHENTICATED", message: "Email hoặc mật khẩu không chính xác" };
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "super_secret_jwt_key",
        { expiresIn: "7d" }
      );

      return {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      };
    },

    async getUser({ id }) {
      const user = await db("users").where({ id }).first();
      if (!user) {
        throw { code: "NOT_FOUND", message: "Không tìm thấy người dùng" };
      }
      return { 
        id: user.id, name: user.name, email: user.email, role: user.role,
        phone: user.phone || "", address: user.address || "", identity_number: user.identity_number || ""
      };
    },

    async updateProfile({ id, name, phone, address, identity_number }) {
      const user = await db("users").where({ id }).first();
      if (!user) {
        throw { code: "NOT_FOUND", message: "Không tìm thấy người dùng" };
      }

      const [updated] = await db("users").where({ id }).update({
        name,
        phone,
        address,
        identity_number
      }).returning("*");

      return {
        id: updated.id, name: updated.name, email: updated.email, role: updated.role,
        phone: updated.phone || "", address: updated.address || "", identity_number: updated.identity_number || ""
      };
    }
  };
}

import grpc from "@grpc/grpc-js";

export function createUserGrpcHandlers(userService) {
  return {
    async Register(call, callback) {
      try {
        const result = await userService.register(call.request);
        callback(null, result);
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "ALREADY_EXISTS") code = grpc.status.ALREADY_EXISTS;
        callback({ code, message: error.message });
      }
    },

    async Login(call, callback) {
      try {
        const result = await userService.login(call.request);
        callback(null, result);
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "NOT_FOUND") code = grpc.status.NOT_FOUND;
        if (error.code === "UNAUTHENTICATED") code = grpc.status.UNAUTHENTICATED;
        callback({ code, message: error.message });
      }
    },

    async GetUser(call, callback) {
      try {
        const user = await userService.getUser(call.request);
        callback(null, { user });
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "NOT_FOUND") code = grpc.status.NOT_FOUND;
        callback({ code, message: error.message });
      }
    },

    async UpdateProfile(call, callback) {
      try {
        const user = await userService.updateProfile(call.request);
        callback(null, { user });
      } catch (error) {
        let code = grpc.status.INTERNAL;
        if (error.code === "NOT_FOUND") code = grpc.status.NOT_FOUND;
        callback({ code, message: error.message });
      }
    }
  };
}
