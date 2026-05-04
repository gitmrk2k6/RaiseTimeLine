package com.raisetimeline.mapper;

import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.entity.Post;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Mapper
public interface PostMapper {

    List<PostResponse> findAll(@Param("before") LocalDateTime before, @Param("limit") int limit);

    @Select("""
            SELECT p.id, p.content, p.created_at, p.updated_at,
                   p.user_id, u.username, u.profile_image_url
            FROM posts p
            JOIN users u ON u.id = p.user_id
            WHERE p.id = #{id}
            """)
    @Results({
        @Result(property = "id",              column = "id"),
        @Result(property = "content",         column = "content"),
        @Result(property = "createdAt",       column = "created_at"),
        @Result(property = "updatedAt",       column = "updated_at"),
        @Result(property = "userId",          column = "user_id"),
        @Result(property = "username",        column = "username"),
        @Result(property = "profileImageUrl", column = "profile_image_url")
    })
    PostResponse findByIdWithUser(Long id);

    @Insert("INSERT INTO posts (user_id, content) VALUES (#{userId}, #{content})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(Post post);

    @Select("SELECT * FROM posts WHERE id = #{id}")
    Optional<Post> findById(Long id);

    @Update("UPDATE posts SET content = #{content}, updated_at = CURRENT_TIMESTAMP WHERE id = #{id}")
    void update(Post post);

    @Delete("DELETE FROM posts WHERE id = #{id}")
    void delete(Long id);
}
