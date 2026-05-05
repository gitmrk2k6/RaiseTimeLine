package com.raisetimeline.mapper;

import com.raisetimeline.dto.CommentResponse;
import com.raisetimeline.entity.Comment;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

@Mapper
public interface CommentMapper {

    List<CommentResponse> findByPostId(@Param("postId") Long postId);

    CommentResponse findResponseById(@Param("id") Long id);

    @Insert("INSERT INTO comments (post_id, user_id, content) VALUES (#{postId}, #{userId}, #{content})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(Comment comment);

    @Select("SELECT * FROM comments WHERE id = #{id}")
    Optional<Comment> findById(Long id);

    @Delete("DELETE FROM comments WHERE id = #{id}")
    void delete(Long id);
}
