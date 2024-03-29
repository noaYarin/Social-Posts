import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Post } from '../interfaces/post';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators'
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

const BACKEND_URL = environment.apiUrl + '/posts/'

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private posts: Post[] = []
  private postsUpdated = new Subject<{ posts: Post[], postCount: number }>()
  constructor(private http: HttpClient, private router: Router) { }

  getPosts(postsPerPage: number, currentPage: number) {
    const queryParams = `?pageSize=${postsPerPage}&page=${currentPage}`;
    this.http.get<{ message: string, posts: Post[], maxPosts: number }>(BACKEND_URL + queryParams)
      .pipe(map((postData: any) => {
        return {
          posts: postData.posts.map(post => {
            return {
              id: post._id,
              title: post.title,
              content: post.content,
              imagePath: post.imagePath,
              creator: post.creator
            }
          }),
          maxPosts: postData.maxPosts
        }
      })
      )
      .subscribe(transformedPostsData => {
        this.posts = transformedPostsData.posts
        this.postsUpdated.next({ posts: [...this.posts], postCount: transformedPostsData.maxPosts })
      })
  }

  getPostUpdatedListener() {
    return this.postsUpdated.asObservable()
  }

  getPost(id: string) {
    return this.http.get<{ post: { _id: string, title: string, content: string, imagePath: string, creator: string } }>(BACKEND_URL + id)
  }

  updatePost(id: string, title: string, content: string, imagePath: string) {
    const post: Post = { id: id, title, content, imagePath, creator: null }
    this.http.put(BACKEND_URL + id, post).subscribe(() => {
      this.router.navigate(['/'])
    })
  }

  addPost(title: string, content: string, image: File) {
    const postData = new FormData()
    postData.append('title', title)
    postData.append('content', content)
    postData.append('image', image, title)

    this.http.post<{ message: string, post: Post }>(BACKEND_URL, postData).subscribe(() => {
      this.router.navigate(['/'])
    })
  }

  deletePost(postId: string) {
    return this.http.delete(BACKEND_URL + postId)
  }
}
