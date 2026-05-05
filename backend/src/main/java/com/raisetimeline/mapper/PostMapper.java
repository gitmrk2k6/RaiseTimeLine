package com.raisetimeline.mapper;

import com.raisetimeline.dto.PostResponse;
import com.raisetimeline.entity.Post;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Mapper
public interface PostMapper {

    List<PostResponse> findAll(
            @Param("before") LocalDateTime before,
            @Param("limit")  int limit,
            @Param("userId") Long userId);

    PostResponse findByIdWithUser(@Param("id") Long id, @Param("userId") Long userId);

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
